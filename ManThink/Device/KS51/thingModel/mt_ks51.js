function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let payload = Buffer.from(msg?.userdata?.payload, "base64");
    //let preTelemetry = device?.telemetry_data?.[thingModelId];
    let port=msg?.userdata?.port || null;
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
        if (payload[0]!=0x82||payload[1]!=0x21||payload[2]!=0x12){  return null }
        if (payload.length <7) {    return null }
        let telemetry_data = {};
        if (payload[3]>0) {
            telemetry_data.status="fault"
            return telemetry_data
        }
        telemetry_data.status="normal"
        telemetry_data.detected=0
        if (payload.readUint8(3)>0){    telemetry_data.detected=1   }
        telemetry_data.vbat=Number(((payload.readUInt8(4)*1.6/254)+2).toFixed(2))
        telemetry_data.rssi=msg.gwrx[0].rssi
        telemetry_data.snr=msg.gwrx[0].lsnr
        return telemetry_data
    }
    let tdata=parseTelemetry(payload)
    let sdata=parseSharedAttrs(payload)
    return {
        telemetry_data: tdata,
        server_attrs: null,
        shared_attrs: sdata
    }
}