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
                case 150:
                    if  ( size<(1+i) ) { break }
                    shared_attrs.cov_enable = "0x"+payload[4+i].toString(16).padStart(2,'0')
                case 152:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.period_measure = payload.readUInt16LE(4+i)
                    break;
                case 154:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.chan1 = payload.readUInt32LE(4+i)
                    break;
                case 158:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.chan2 = payload.readUInt32LE(4+i)
                    break;
                case 162:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.chan3 = payload.readUInt32LE(4+i)
                    break;
                case 166:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.chan4 = payload.readUInt32LE(4+i)
                    break;
                default: break
            }
        }
        if (Object.keys(shared_attrs).length == 0) {    return null }
        return shared_attrs;
    }
    function parseTelemetry(payload){
        if (msg.userdata.port!=11) { return null}
        if (payload[0]!=0x82||payload[1]!=0x25){    return null }
        if (payload.length <21) {   return null }
        let telemetry_data = {}
        let powerVal=10
        if (payload[2]==0x17) {
            powerVal=11
            telemetry_data.type="4-20mA"
        }else if (payload[1]==0x18){
            powerVal=10
            telemetry_data.type="0-10V"
        }else {
            return null
        }
        if (payload[3]>0) {
            telemetry_data.status="fault"
            return telemetry_data
        }
        telemetry_data.status="normal"
        telemetry_data.chan1=Number((payload.readInt32LE(4)*powerVal/64000).toFixed(2))
        telemetry_data.chan2=Number((payload.readInt32LE(8)*powerVal/64000).toFixed(2))
        telemetry_data.chan3=Number((payload.readInt32LE(12)*powerVal/64000).toFixed(2))
        telemetry_data.chan4=Number((payload.readInt32LE(16)*powerVal/64000).toFixed(2))
        telemetry_data.vbat=Number(((payload.readUInt8(20)*1.6/254)+2).toFixed(2))
        telemetry_data.rssi=msg.gwrx[0].rssi
        telemetry_data.snr=msg.gwrx[0].lsnr
        return telemetry_data
    }
    let appData= parseTelemetry(payload)
    return {
        telemetry_data: appData,
        server_attrs: (appData==null)?null:{"type":appData?.type},
        shared_attrs: null,
    }
}