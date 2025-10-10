function rpc_script({device, values}) {
    function encode(values) {
        let buffer = Buffer.from("CF1C641Afafa010000000200000003000000040000000500000006000000", "hex")
        buffer.writeUint32LE(values.base1,6)
        buffer.writeUint32LE(values.base2,10)
        buffer.writeUint32LE(values.base3,14)
        buffer.writeUint32LE(values.base4,18)
        buffer.writeUint32LE(values.base5,22)
        buffer.writeUint32LE(values.base6,26)
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
                    "dnWaitms":3000,
                    "type":"data",
                    "intervalms":0
                }
            }
        }
    ]
}