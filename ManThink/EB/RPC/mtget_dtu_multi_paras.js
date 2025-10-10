function rpc_script({device, values}) {
    function encode(values) {
        let buffer = Buffer.from("8F027814", "hex")
        buffer.writeUInt8(2+(values.addr_len)*(values.device_counts),3)
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