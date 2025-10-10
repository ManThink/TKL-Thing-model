function rpc_script({device, values}) {
    function encode(values) {
        let buffer = Buffer.from(values.payload, "hex")
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
                    "port":51,
                    "TxUTCtime":"",
                    "payload":encode(values),
                    "dnWaitms":3000,
                    "type":"data",
                    "intervalms":0
                }
            }
        }
    ]
}