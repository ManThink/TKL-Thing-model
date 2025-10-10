function rpc_script({device, values}) {
    function encode(msg) {
        let buffer = Buffer.from(values.data.replace(/\s/g, ""), "hex")
        return buffer.toString("base64");
    }
    return [
        {
            sleepTimeMs: 0,
            dnMsg: {
                "version":"3.0",
                "type":values.type,
                "if":"loraWAN",
                "moteeui": device.eui,
                "token": new Date().getTime(),
                "userdata":{
                    "confirmed":values.confirmed,
                    "fpend":false,
                    "port":values.port,
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
rpc_script({device:{eui:"123456"},values:{data:"8F 02 2A"},type:"data",confirmed:false,port:214})