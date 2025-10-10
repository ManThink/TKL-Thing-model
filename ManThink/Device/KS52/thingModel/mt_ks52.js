function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let    payload = Buffer.from(msg?.userdata?.payload, "base64");
    let    port=msg?.userdata?.port || null;
    function parseSharedAttrs(payload) {
        if (port!=214||payload[0]!=0x2F) { return null}
        let shared_attrs = {};
        if (payload.length<5) { return null}
        shared_attrs.content = payload.toString('hex');
        let size=payload.length-4
        let regAddress=payload[2]
        for (let i=0; i<size; i++) {
            regAddress=payload[2]+i
            switch (regAddress) {
                case  58:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.period_data = payload.readUInt16LE(4+i)
                    break;
                case 142:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.period_measure = payload.readUInt16LE(4+i)
                    break;
                case 144:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_temperatrue = payload.readUInt8(4+i)*0.1
                    break;
                case 145:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_humidity = payload.readUInt8(4+i)*0.1
                    break;
                default: break
            }
        }
        if (Object.keys(shared_attrs).length == 0) {
            return null
        }
        return shared_attrs;
    }
    function parseTelemetry(payload){
        if (port!=11||payload[0]!=0x21||payload[1]!=0x07||payload[2]!=0x03||payload.length !=15){
            return null
        }
        let telemetry_data = {};
        telemetry_data.period_data =payload.readUInt16LE(5)
        telemetry_data.status ="normal"
        if ((payload[7]&0x01)!=0){  telemetry_data.status ="fault" }
        telemetry_data.temperatrue=Number(((payload.readUInt16LE(8)-1000)/10.00).toFixed(2))
        telemetry_data.humidity=Number((payload.readUInt16LE(10)/10.0).toFixed(2))
        let vbat=payload.readUInt8(12)
        telemetry_data.vbat=Number(((vbat*1.6)/254 +2.0).toFixed(2))
        telemetry_data.rssi=msg.gwrx[0].rssi
        telemetry_data.snr=msg.gwrx[0].lsnr
        return telemetry_data
    }
    let tdata=parseTelemetry(payload)
    let sdata=parseSharedAttrs(payload)
    if (tdata?.period_data!=null){
        if (sdata===null) {sdata={}}
        sdata.period_data = tdata.period_data
    }
    return {
            telemetry_data: tdata,
            server_attrs: null,
            shared_attrs: sdata
    }
}
console.log(payload_parser({
    device: {},
    msg: {
        "if": "loraWAN",
        "gwrx": [
            {
                "eui": "5a53012501030058",
                "chan": 0,
                "lsnr": 13.5,
                "rfch": 0,
                "rssi": -34,
                "time": "2025-10-05T23:58:03.8586758Z",
                "tmms": 0,
                "tmst": 422445596,
                "ftime": 0
            },
            {
                "eui": "5a53012501030056",
                "chan": 3,
                "lsnr": 13.8,
                "rfch": 0,
                "rssi": -32,
                "time": "2025-10-05T23:58:03.8586758Z",
                "tmms": 0,
                "tmst": 419275826,
                "ftime": 0
            }
        ],
        "type": "data",
        "token": 1790270,
        "moteTx": {
            "codr": "4/5",
            "datr": "SF7BW125",
            "freq": 470.9,
            "modu": "LORA",
            "macAck": "",
            "macCmd": ""
        },
        "geoInfo": {
            "type": "gw:wifi",
            "accuracy": 50,
            "altitude": 0,
            "latitude": 34.19786,
            "longitude": 108.86584
        },
        "moteeui": "6353012af1093063",
        "version": "3.0",
        "userdata": {
            "port": 11,
            "class": "ClassA",
            "seqno": 12499,
            "payload": "IQcDDG4PAADABLQCz3gJ",
            "confirmed": false
        }
    },
    thingModelId: "1",
    noticeAttrs: {telemetry_data:true}

}))