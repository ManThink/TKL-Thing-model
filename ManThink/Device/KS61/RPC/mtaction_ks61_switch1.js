function rpc_script({device, values}) {
    //let switchStatus=values?.status?.toLowerCase()
    let switchStatus=values?.status
    function encode(msg) {
        let buffer = Buffer.from("820801", "hex")
        if (switchStatus){
            buffer[2]=0x11
        }else {
            buffer[2]=0x01
        }
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
                    "port":12,
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