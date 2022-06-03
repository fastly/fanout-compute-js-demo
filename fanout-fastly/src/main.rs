use fastly::experimental::RequestUpgradeWebsocket;
use fastly::{Error, Request};

fn main() -> Result<(), Error> {
    let req = Request::from_client();

    if let Some("websocket") = req.get_header_str("Upgrade") {
        return Ok(req.upgrade_websocket("edge_app")?);
    }

    Ok(req.send("edge_app")?.send_to_client())
}
