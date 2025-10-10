function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let payload = Buffer.from(msg?.userdata?.payload, "base64");
    let port=msg?.userdata?.port;
    let preTelemetry = device?.telemetry_data?.[thingModelId];
    function parseTelemetry(payload){

        if (port!=12||payload[0]!=0x21||payload[1]!=0x05) { return {sdevice:null,tdata:null}}
        if (payload.length <38) {return {sdevice:null,tdata:null}}
        let telemetryData={}
        let subDevice=payload.readUInt32LE(2).toString(10).padStart(12, '0')
        telemetryData.ua=Number((payload.readUInt16LE(10)/10).toFixed(1))
        telemetryData.ub=Number((payload.readUInt16LE(12)/10).toFixed(1))
        telemetryData.uc=Number((payload.readUInt16LE(14)/10).toFixed(1))
        telemetryData.ia=Number((payload.readUInt16LE(16)/10).toFixed(1))
        telemetryData.ib=Number((payload.readUInt16LE(18)/10).toFixed(1))
        telemetryData.ic=Number((payload.readUInt16LE(20)/10).toFixed(1))
        telemetryData.yz=Number((payload.readUInt32LE(22)/10).toFixed(1))
        telemetryData.yf=Number((payload.readUInt32LE(26)/10).toFixed(1))
        telemetryData.wz=Number((payload.readUInt32LE(30)/10).toFixed(1))
        telemetryData.wf=Number((payload.readUInt32LE(34)/10).toFixed(1))
        return {
            sdevice: subDevice,
            tdata: telemetryData
        }
    }
    let appData= parseTelemetry(payload)
    return {
        sub_device: appData.sdevice,
        telemetry_data: appData.tdata,
        server_attrs:  (appData.sdevice===null)?null:{"sub_addr":appData.sdevice},
        shared_attrs: null
    }
}