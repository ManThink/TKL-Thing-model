function rpc_script({device, values}) {
    function encode(msg) {
    let buffer = Buffer.from("CF03090102", "hex")
    return buffer.toString("base64");
    }
    return [
    {
        sleepTimeMs: 0,
        dnMsg: {
            "version":"3.0",
            "type":"data",
            "if":"loraWAN",
            "moteeui": device.eui,
            "token": new Date().getTime(),
            "userdata":{
                "confirmed":false,
                "fpend":false,
                "port":214,
                "TxUTCtime":"",
                "payload":encode(values),
                "dnWaitms":0,
                "type":"data",
                "intervalms":0
            }
        }
    }
]
}