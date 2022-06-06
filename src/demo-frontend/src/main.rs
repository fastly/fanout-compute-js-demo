use log;
use rand::Rng;
use serde_json::json;
use fastly::experimental::RequestUpgradeWebsocket;
use fastly::http::{header, Method, StatusCode};
use fastly::{mime, Error, Request, Response, Body};

fn log_id() -> String {
    const CHARSET: &[u8] = b"0123456789abcdef";
    let mut rng = rand::thread_rng();
    return (0..8)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect();
}

fn main() -> Result<(), Error> {

    log_fastly::init_simple("demo_logs", log::LevelFilter::Info);

    let req = Request::from_client();
    let session_id = req.get_query_parameter("session");

    // Upgrade websocket requests
    if let Some("websocket") = req.get_header_str("Upgrade") {
        log::info!("{}", json!({
            "logID": log_id(),
            "session": session_id,
            "context": "edge",
            "source": std::env::var("FASTLY_HOSTNAME").unwrap(),
            "msg": "Upgrading websocket connection",
        }).to_string());
        return Ok(req.upgrade_websocket("edge_app")?);
    }

    // Send API requests to the edge app
    let path = req.get_path();
    if path.starts_with("/api/") {
        // We set pass to true because API data needs to be fresh.
        return Ok(
            req.with_pass(true)
                .send("edge_app")?
                .send_to_client()
        );
    }

    // GET/HEAD for Static files
    match req.get_method() {
        &Method::GET | &Method::HEAD => (),
        _ => {
            return Ok(
                Response::from_status(StatusCode::METHOD_NOT_ALLOWED)
                    .with_header(header::ALLOW, "GET, HEAD")
                    .with_body_text_plain("This method is not allowed\n")
                    .send_to_client()
            )
        }
    };

    let response = Response::from_status(200);

    let response_with_content = match path {
        "/main.js" => {
            response
                .with_content_type(mime::APPLICATION_JAVASCRIPT_UTF_8)
                .with_body(include_str!("main.js"))
        }
        "/main.css" => {
            response
                .with_content_type(mime::TEXT_CSS_UTF_8)
                .with_body(include_str!("main.css"))
        }
        "/robots.txt" => {
            response
                .with_content_type(mime::TEXT_PLAIN_UTF_8)
                .with_body(include_str!("robots.txt"))
        }
        "/.well-known/fastly/demo-manifest" => {
            response
                .with_content_type(mime::TEXT_PLAIN_UTF_8)
                .with_body(include_str!("demo-manifest"))
        }
        "/images/screenshot.png" => {
            let bytes = include_bytes!("screenshot.png").to_vec();
            response
                .with_content_type(mime::IMAGE_PNG)
                .with_body(bytes)
        }
        _ => {
            // incl. index.html
            log::info!("{}", json!({
                "logID": log_id(),
                "session": session_id,
                "context": "main",
                "source": std::env::var("FASTLY_HOSTNAME").unwrap(),
                "msg": "Sending index.html",
            }).to_string());
            response
                .with_content_type(mime::TEXT_HTML_UTF_8)
                .with_body(include_str!("index.html"))
        }
    };

    Ok(response_with_content.send_to_client())
}
