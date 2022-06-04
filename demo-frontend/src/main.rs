use fastly::experimental::RequestUpgradeWebsocket;
use fastly::http::{header, Method, StatusCode};
use fastly::{mime, Error, Request, Response, Body};

fn main() -> Result<(), Error> {

    let req = Request::from_client();

    // Upgrade websocket requests
    if let Some("websocket") = req.get_header_str("Upgrade") {
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
                .with_content_type(mime::APPLICATION_JAVASCRIPT)
                .with_body(include_str!("main.js"))
        }
        "/main.css" => {
            response
                .with_content_type(mime::TEXT_CSS)
                .with_body(include_str!("main.css"))
        }
        "/robots.txt" => {
            response
                .with_content_type(mime::TEXT_PLAIN)
                .with_body(include_str!("robots.txt"))
        }
        "/.well-known/fastly/demo-manifest" => {
            response
                .with_content_type(mime::TEXT_PLAIN)
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
            response
                .with_content_type(mime::TEXT_HTML)
                .with_body(include_str!("index.html"))
        }
    };

    Ok(response_with_content.send_to_client())
}
