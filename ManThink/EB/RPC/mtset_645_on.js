function rpc_script({device, values}) {
    function crc8(data, poly = 0x07) {
        let crc = 0x00;
        for (const byte of data) {
            crc ^= byte;
            for (let i = 0; i < 8; i++) {
                if (crc & 0x80) {
                    crc = (crc << 1) ^ poly;
                } else {
                    crc = crc << 1;
                }
                crc &= 0xFF;
            }
        }
        return crc.toString(16).padStart(2, '0');
    }
    function encode(values) {
        let buffer = Buffer.from("fe68010203040506681c1035333333333333334e330000000000000016", "hex")
        buffer.writeUint32LE( Number(device?.shared_attrs?.identifier),2)
        let crcSum=crc8(buffer.subarray(1,-3))
        buffer.writeUint8(Number(crcSum),buffer.length-2)
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
console.log(rpc_script({
    device: {},
    values:{}
}
))