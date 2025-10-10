function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let payload = Buffer.from(msg?.userdata?.payload, "base64");
    let port=msg?.userdata?.port || null;
    function parseSharedAttrs(payload) {
        if (port==214) {
            if (payload.length < 5) { return null; }
            if (payload[0] != 0x2F) { return null}
        }else if (port==61) {
            if (payload.length<4) { return null}
            if (payload[0]!=0x81||payload[1]!=0x21||payload[2]!=0x03) { return null}
        }else {
            return null;
        }
        let system_info = {};
        system_info.content = payload.toString('hex');
        let size = payload.length - 4;
        let startAddress = payload[2];
        let index=4
        if (port==61){
            startAddress=0
            size=24
            index=3
        }
    let regAddress=startAddress
        for (let i = 0; i < size; i++) {
            regAddress = startAddress + i;
            switch (regAddress) {
                // Version Information (0-7)
                case 0:
                    if (size < (2 + i)) { break; }
                    system_info.FuotaVersion = payload[index + i] & 0x0F;
                    let hw_type_low = (payload[index + i] >> 4) & 0x0F;
                    let hw_type_high = payload[index + i];
                    let hw_type=(hw_type_high<<4)|(hw_type_low&0x0F)
                    if (hw_type==40) {
                        system_info.HwType="OM422"
                    }else if (hw_type==51) {
                        system_info.HwType="OM822"
                    }
                    break;
                case 2:
                    if (size < (1 + i)) { break; }
                    //system_info.fuota_copy_bytes = (payload[index + i] & 0x0F) * 4;
                    system_info.HwVersion = (payload[index + i] >> 4) & 0x0F;
                    break;
                case 3:
                    if (size < (1 + i)) { break; }
                    system_info.SwVersion = payload[index + i];
                    break;
                case 4:
                    if (size < (2 + i)) { break; }
                    system_info.BzType = payload.readUInt16LE(index + i);
                    break;
                case 6:
                    if (size < (1 + i)) { break; }
                    system_info.BzVersion = payload[index + i];
                    break;
                case 7:
                    if (size < (1 + i)) { break; }
                    system_info.FilterMask = payload[index + i] & 0x07;
                    system_info.OtaMask = (payload[index + i] >> 4) & 0x07;
                    //system_info.check_ok = ((payload[index + i] >> 7) & 0x01)?true:false;
                    break;

                // Runtime Parameters (8-23)
                case 8:
                    if (size < (1 + i)) { break; }
                    system_info.field_mode = (payload[index + i] & 0x01)?true:false;
                    system_info.relay_enable = ((payload[index + i] >> 1) & 0x01)?true:false;
                    break;
                case 11:
                    if (size < (1 + i)) { break; }
                    system_info.WakeupIn = (payload[index + i] & 0x01)?true:false;
                    system_info.WakeupOut = ((payload[index + i] >> 1) & 0x01)?true:false;
                    let backhaul= (payload[index + i] >> 4) & 0x07;
                    if (backhaul==0){
                        system_info.BackHaul="bh_lorawan"
                    }else if (backhaul==1){
                        system_info.BackHaul="bh_4g"
                    }


                    break;
                case 12:
                    if (size < (1 + i)) { break; }
                    system_info.BaudRate = payload[index + i]*1200;
                    break;
                case 13:
                    if (size < (1 + i)) { break; }
                    system_info.DataBits = payload[index + i] & 0x0F;
                    system_info.StopBits = (payload[index + i] >> 4) & 0x03;
                     let check= (payload[index + i] >> 6) & 0x03;
                    system_info.Checkbit="none"
                     if (check==1) {
                         system_info.Checkbit="odd"
                     }else {
                         system_info.Checkbit="even"
                     }
                    break;
                case 14:
                    if (size < (1 + i)) { break; }
                    system_info.KeepRx = (payload[index + i] & 0x01)>0 ? true : false;
                    system_info.Battery = ((payload[index + i] >> 1) & 0x01)>0?true:false;
                    system_info.Uart1Used = ((payload[index + i] >> 2) & 0x01)>0?true:false;
                    system_info.TransparentBit = ((payload[index + i] >> 3) & 0x01)>0?true:false;
                    system_info.SwUp = ((payload[index + i] >> 4) & 0x01)>0?true:false;
                    system_info.JoinRst = ((payload[index + i] >> 5) & 0x01)>0?true:false;
                    system_info.PowerCtrl = ((payload[index + i] >> 6) & 0x01)>0?true:false;
                    system_info.Wait60s = ((payload[index + i] >> 7) & 0x01)?true:false;
                    break;
                case 15:
                    if (size < (1 + i)) { break; }
                    system_info.ConfirmDuty = payload[index + i];
                    break;
                case 16:
                    if (size < (1 + i)) { break; }
                    system_info.portPara = payload[index + i];
                    break;
                case 17:
                    if (size < (1 + i)) { break; }
                    system_info.portTransparent = payload[index + i];
                    break;
                case 18:
                    if (size < (2 + i)) { break; }
                    system_info.RstHours = payload.readUInt16LE(index + i);
                    break;
                case 20:
                    if (size < (4 + i)) { break; }
                    system_info.TimeOffset = payload.readUInt32LE(index + i);
                    break;

                // System Information (24-43)
                case 24:
                    if (size < (1 + i)) { break; }
                    system_info.battery_base = payload[index + i];
                    break;
                case 25:
                    if (size < (4 + i)) { break; }
                    system_info.utc_seconds = payload.readUInt32LE(index + i);
                    break;
                case 29:
                    if (size < (2 + i)) { break; }
                    let temp_raw = payload.readUInt16LE(index + i);
                    system_info.chip_temperature = ((temp_raw - 1000) / 10).toFixed(1);
                    break;
                case 31:
                    if (size < (1 + i)) { break; }
                    system_info.chip_voltage = (payload[index + i] / 254 * 1.6 + 2).toFixed(2);
                    break;
                case 32:
                    if (size < (2 + i)) { break; }
                    let timeout = payload.readUInt16LE(index + i);
                    let timeout_unit = (timeout >> 14) & 0x03;
                    let timeout_value = timeout & 0x3FFF;
                    if (timeout_unit==0) {
                        timeout_value=timeout_value*1000
                    }else if (timeout_unit==1) {
                        timeout_unit=timeout_value*60000
                    }else if (timeout_unit==2) {
                        timeout_value=timeout_value*3600000
                    }else  {
                        timeout_value=timeout_value
                    }
                    system_info.query_timeout = timeout_value;
                    break;
                case 34:
                    if (size < (1 + i)) { break; }
                    system_info.retries = payload[index + i];
                    break;
                case 35:
                    if (size < (1 + i)) { break; }
                    system_info.uart_calibration = payload[index + i] & 0x01;
                    system_info.calibration_method = (payload[index + i] >> 1) & 0x03;
                    break;
                case 36:
                    if (size < (1 + i)) { break; }
                    system_info.calibration_groups = payload[index + i];
                    break;
                case 37:
                    if (size < (1 + i)) { break; }
                    system_info.periodic_join_interval = payload[index + i];
                    break;
                case 38:
                    if (size < (2 + i)) { break; }
                    system_info.peripheral_power_delay = payload.readUInt16LE(index + i);
                    break;
                case 60:
                    if (size < (1 + i)) { break; }
                    system_info.sub_device_counts = payload[index + i];
                default:
                    break;
            }
        }
        if (Object.keys(system_info).length < 1) { return null; }
        return system_info;
    }
    function parseTelemetry(payload){
        if (port!=51){  return null}
        let telemetry_data = {};
        telemetry_data.payload =payload.toString('hex')
        telemetry_data.rssi=msg.gwrx[0].rssi
        telemetry_data.snr=msg.gwrx[0].lsnr
        return telemetry_data
    }
    let tdata=parseTelemetry(payload)
    let sdata=parseSharedAttrs(payload)
    if (sdata===null) {sdata={}}
    sdata.class_mode=msg?.userdata?.class
    if (tdata?.period_data!=null){
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
                "lsnr": 14.5,
                "rfch": 0,
                "rssi": -28,
                "time": "2025-09-26T12:10:12.8106710Z",
                "tmms": 0,
                "tmst": 3842395545,
                "ftime": 0
            },
            {
                "eui": "5a53012501030056",
                "chan": 1,
                "lsnr": 14,
                "rfch": 0,
                "rssi": -29,
                "time": "2025-09-26T12:10:12.8106710Z",
                "tmms": 0,
                "tmst": 3162372625,
                "ftime": 0
            },
            {
                "eui": "5a53012501030011",
                "chan": 1,
                "lsnr": 13.8,
                "rfch": 0,
                "rssi": -85,
                "time": "2025-09-26T12:10:12.8106710Z",
                "tmms": 0,
                "tmst": 394743990,
                "ftime": 0
            }
        ],
        "type": "data",
        "token": 385647,
        "moteTx": {
            "codr": "4/5",
            "datr": "SF7BW125",
            "freq": 470.5,
            "modu": "LORA",
            "macAck": " [down] 60195d013220c076bc0ad010",
            "macCmd": ""
        },
        "geoInfo": {
            "type": "gw:wifi",
            "accuracy": 50,
            "altitude": 0,
            "latitude": 34.19746,
            "longitude": 108.86491
        },
        "moteeui": "6353012af1099301",
        "version": "3.0",
        "userdata": {
            "port": 214,
            "class": "ClassA",
            "seqno": 24207,
            "payload": "LyoAKIECIx5hAQ8AAAAAAAGZAjxHM/AAAAAAAACkgtZo8ASmAgADAAABBQA=",
            "confirmed": true
        }
    },
    thingModelId: "1",
    noticeAttrs: {telemetry_data:true}

}))