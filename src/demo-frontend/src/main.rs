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

fn log_demo(session_id: Option<&str>, msg: &str) {
    log::info!("{}", json!({
        "logID": log_id(),
        "session": session_id,
        "context": "edge",
        "source": std::env::var("FASTLY_HOSTNAME").unwrap(),
        "msg": msg,
    }).to_string());
}

fn main() -> Result<(), Error> {

    let req = Request::from_client();

    // Upgrade websocket requests
    if let Some("websocket") = req.get_header_str("Upgrade") {
        log_fastly::init_simple("demo_logs", log::LevelFilter::Info);
        let session_id = req.get_query_parameter("session");
        log_demo(session_id, "Upgrading websocket connection");
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

    return Ok(req.send("edge_app")?.send_to_client());
}
