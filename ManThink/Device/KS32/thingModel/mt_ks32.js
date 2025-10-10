function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let payload = Buffer.from(msg?.userdata?.payload, "base64");
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
                case 100:
                    if  ( size<(2+i) ) { break }
                    shared_attrs.base_header = payload.readUInt16LE(4+i)
                case 102:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.base1 = payload.readUInt32LE(4+i)
                    break;
                case 106:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.base2 = payload.readUInt32LE(4+i)
                    break;
                case 110:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.base3 = payload.readUInt32LE(4+i)
                    break;
                case 114:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.base4 = payload.readUInt32LE(4+i)
                    break;
                case 118:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.base5 = payload.readUInt32LE(4+i)
                    break;
                case 122:
                    if  ( size<(4+i) ) { break }
                    shared_attrs.base6 = payload.readUInt32LE(4+i)
                    break;
                default: break
            }
        }
        if (Object.keys(shared_attrs).length == 0) {    return null }
        return shared_attrs;
    }
    function parseTelemetry(payload){
        if (port!=15) { return null}
        if (payload[0]!=0x82||payload[1]!=0x24|| payload[2]!=0x1A){ return null }
        if (payload.length <30) {   return null }
        let telemetry_data = {};
        if (payload[4]>0) {
            telemetry_data.status="fault"
            return telemetry_data
        }
        telemetry_data.vbat=Number(((payload.readUInt8(5)*1.6/254)+2).toFixed(2))
        let diVal=payload[3]
        telemetry_data.chan1=((diVal&0x01)==0x01)?1:0
        telemetry_data.chan2=((diVal&0x02)==0x02)?1:0
        telemetry_data.chan3=((diVal&0x04)==0x04)?1:0
        telemetry_data.chan4=((diVal&0x08)==0x08)?1:0
        telemetry_data.chan5=((diVal&0x10)==0x10)?1:0
        telemetry_data.chan6=((diVal&0x20)==0x20)?1:0
        telemetry_data.counter1=payload.readInt32LE(6)
        telemetry_data.counter2=payload.readInt32LE(10)
        telemetry_data.counter3=payload.readInt32LE(14)
        telemetry_data.counter4=payload.readInt32LE(18)
        telemetry_data.counter5=payload.readInt32LE(22)
        telemetry_data.counter6=payload.readInt32LE(26)
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