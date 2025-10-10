function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let payload = Buffer.from(msg?.userdata?.payload, "base64");
    let port=msg?.userdata?.port;
    //let preTelemetry = device?.telemetry_data?.[thingModelId];
    function parseSharedAttrs(payload) {
        if (port!=214||payload[0]!=0x2F) { return null}
        let shared_attrs ={}
        shared_attrs.content = payload.toString('hex')
        if (payload.length<5) { return null}
        let size=payload.length-4
        let regAddress=payload[2]
        for (let i=0; i<size; i++) {
            regAddress=payload[2]+i
            switch (regAddress) {
                case  58:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.period_data = payload.readUInt16LE(4+i)
                    break;
                case 152:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.enable = "0x"+payload.readUInt8(4+i).toString(16).padStart(2, '0')
                    break;
                case 153:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_temperatrue = payload.readUInt8(4+i)*0.1
                    break;
                case 154:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_humidity = payload.readUInt8(4+i)
                    break;
                case 155:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_tvoc = payload.readUInt8(4+i)
                    break;
                case 156:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_co2 = payload.readUInt8(4+i)
                    break;
                case 157:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_pm25 = payload.readUInt8(4+i)
                    break;
                case 158:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.pir_delay = payload.readUInt16LE(4+i)
                    break;
                case 160:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.lux_threshold1 = payload.readUInt16LE(4+i)
                    break;
                case 162:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.lux_threshold2 = payload.readUInt16LE(4+i)
                    break;
                case 164:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.lux_threshold3 = payload.readUInt16LE(4+i)
                    break;
                case 166:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.pir_mask ="0x"+ payload.readUInt8(4+i).toString(16).padStart(2, '0')
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
        if (port!=11) { return null}
        if (payload[0]!=0x82||payload[1]!=0x24||payload[2]!=0x07){  return null }
        let telemetryData={}
        if (payload.length <24) {   return null }
        if (payload[3]>0) {
            telemetryData.status="fault"
            return telemetryData
        }
        telemetryData.temperatrue=Number((payload.readInt16LE(4)/10).toFixed(1))
        telemetryData.humidity=Number((payload.readInt16LE(6)/10).toFixed(1))
        telemetryData.co2=Number(payload.readInt16LE(8))
        telemetryData.light=Number(payload.readInt16LE(10))
        telemetryData.tvoc=Number(payload.readInt32LE(12))
        let pirval=payload.readUInt8(17)
        telemetryData.pir= (pirval>0)?1:0
        let relayval =payload.readUInt8(18)
        telemetryData.relay1=((relayval&0x01)===0x01)?1:0
        telemetryData.relay2=((relayval&0x02)===0x02)?1:0
        telemetryData.relay3=((relayval&0x04)===0x04)?1:0
        telemetryData.pm25=Number((payload.readFloatLE(20)).toFixed(2))
        telemetry_data.rssi=msg.gwrx[0].rssi
        telemetry_data.snr=msg.gwrx[0].lsnr
        return telemetryData
    }
    let appData= parseTelemetry(payload)
    let sattrs=parseSharedAttrs(payload)
    return {
        telemetry_data: appData,
        server_attrs: null,
        shared_attrs: sattrs,
    }
}
console.log(payload_parser({
    device: {},
    msg: {
        "if": "loraWAN",
        "gwrx": [
            {
                "eui": "5a53012501030056",
                "chan": 0,
                "lsnr": 14.5,
                "rfch": 1,
                "rssi": -44,
                "time": "2025-09-26T06:09:03.809679Z",
                "tmms": 0,
                "tmst": 2968300578,
                "ftime": 0
            },
            {
                "eui": "5a53012501030011",
                "chan": 4,
                "lsnr": -2.5,
                "rfch": 1,
                "rssi": -113,
                "time": "2025-09-26T06:09:03.809679Z",
                "tmms": 0,
                "tmst": 200670254,
                "ftime": 0
            },
            {
                "eui": "5a53012501030058",
                "chan": 4,
                "lsnr": 14,
                "rfch": 1,
                "rssi": -50,
                "time": "2025-09-26T06:09:03.809679Z",
                "tmms": 0,
                "tmst": 3648321100,
                "ftime": 0
            }
        ],
        "type": "data",
        "token": 345752,
        "moteTx": {
            "codr": "4/5",
            "datr": "SF7BW125",
            "freq": 471.1,
            "modu": "LORA",
            "macAck": " [down] 60433901322092c9ae9b91f5",
            "macCmd": ""
        },
        "geoInfo": {
            "type": "gw:wifi",
            "accuracy": 50,
            "altitude": 0,
            "latitude": 34.19729,
            "longitude": 108.86398
        },
        "moteeui": "6353012af1090142",
        "version": "3.0",
        "userdata": {
            "port": 214,
            "class": "ClassC",
            "seqno": 42343,
            "payload": "LxGYDwAKFDJkCiwBZADIACwBBw==",
            "confirmed": true
        }
    },
    thingModelId: "1",
    noticeAttrs: {telemetry_data:true}

}))