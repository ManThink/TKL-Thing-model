function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let preTelemetry = device?.telemetry_data?.[thingModelId];
    let tdata={}
    let sdata={}
    msg.thing_model.forEach((tid) => {
        if (msg.telemetry_data?.[tid]?.temperatrue != null) {
            sdata.temperatrue = msg.telemetry_data[tid]?.temperatrue
            sdata.humidity = msg.telemetry_data[tid]?.humidity
        }
    })
    sdata.time=new Date().toLocaleString()
    tdata.avgT = device.telemetry_data?.[thingModelId]?.avgT ?? 0
    tdata.avgH = device.telemetry_data?.[thingModelId]?.avgH ?? 0
    if (tdata.avgT === null) {   tdata.avgT = sdata.temperatrue    }
    if (tdata.avgH === null) {tdata.avgH = sdata.humidity}
    tdata.avgT = Number(((tdata.avgT + sdata.temperatrue) / 2).toFixed(2))
    tdata.avgH = Number(((tdata.avgH + sdata.humidity) / 2).toFixed(2))
    return {
        telemetry_data: sdata,
        server_attrs: {[msg.eui]:sdata},
        shared_attrs: null,
    }
}