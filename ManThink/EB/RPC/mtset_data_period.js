function rpc_script({device, values}) {
    function encode(values) {
        let buffer = Buffer.from("CF043A020807", "hex")
        buffer.writeUInt16LE(values.period,4)
        return buffer.toString("base64");
    }
    return [
        {
            sleepTimeMs: 0,
            dnMsg: {
                "version": "3.0",
                "type": "data",
                "if": "loraWAN",
                "moteeui": device.eui,
                "token": new Date().getTime(),
                "userdata": {
                    "confirmed": true,
                    "fpend": false,
                    "port": 214,
                    "TxUTCtime": "",
                    "payload": encode(values),
                    "dnWaitms": 0,
                    "type": "data",
                    "intervalms": 0
                }
            }

        }
    ]
}