function payload_parser({device, msg, thingModelId, noticeAttrs}) {
    let payload = Buffer.from(msg?.userdata?.payload, "base64");
    let port=msg?.userdata?.port || null;
    function parseSharedAttrs(payload) {
        if (port != 214 || payload[0] != 0x2F) { return null; }
        let system_info = {};
        system_info.content = payload.toString('hex');
        if (payload.length < 6) { return null; }
        let regAddress = payload[2];
        if (regAddress!=120) { return null; }
        system_info.query_index=payload[4] //120
        system_info.sub_addr_size=payload[5] //121
        let size = payload.length - 6;
        for (let i = 0; i < 6; i++) {
            if (size<i*system_info.sub_addr_size) { break}
            const subBuf = payload.subarray(6+i*system_info.sub_addr_size, 6+i*system_info.sub_addr_size+system_info.sub_addr_size);
            switch (i) {
                case 0: system_info.sub_addr1 = subBuf.toString('hex'); break;
                case 1: system_info.sub_addr2 = subBuf.toString('hex'); break;
                case 2: system_info.sub_addr3 =subBuf.toString('hex');break;
                case 3: system_info.sub_addr4 = subBuf.toString('hex'); break;
                case 4: system_info.sub_addr5 = subBuf.toString('hex'); break;
                case 5: system_info.sub_addr6 =subBuf.toString('hex');break;
                default: break;
            }
        }
        if (Object.keys(system_info).length < 1) { return null; }
        return system_info;
    }
    let sdata=parseSharedAttrs(payload)
    return {
        telemetry_data: null,
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
                "eui": "5a53012501030056",
                "chan": 0,
                "lsnr": 13.8,
                "rfch": 0,
                "rssi": -50,
                "time": "2025-09-28T05:34:42.8346734Z",
                "tmms": 0,
                "tmst": 1930515244,
                "ftime": 0
            },
            {
                "eui": "5a53012501030011",
                "chan": 0,
                "lsnr": 12.2,
                "rfch": 0,
                "rssi": -94,
                "time": "2025-09-28T05:34:42.8346734Z",
                "tmms": 0,
                "tmst": 3436014147,
                "ftime": 0
            },
            {
                "eui": "5a53012501030058",
                "chan": 0,
                "lsnr": 13.2,
                "rfch": 0,
                "rssi": -64,
                "time": "2025-09-28T05:34:42.8346734Z",
                "tmms": 0,
                "tmst": 1910731249,
                "ftime": 0
            }
        ],
        "type": "data",
        "token": 651059,
        "moteTx": {
            "codr": "4/5",
            "datr": "SF7BW125",
            "freq": 470.3,
            "modu": "LORA",
            "macAck": " [down] 60e8660132206e048e9658cd",
            "macCmd": ""
        },
        "geoInfo": {
            "type": "gw:wifi",
            "accuracy": 50,
            "altitude": 0,
            "latitude": 34.19721,
            "longitude": 108.86367
        },
        "moteeui": "6353012af10a1805",
        "version": "3.0",
        "userdata": {
            "port": 214,
            "class": "ClassC",
            "seqno": 6015,
            "payload": "Lxx4GgYEEjRWeACq/wEAAAAAAAAAAAAAAAAAAAAA",
            "confirmed": true
        }
    },
    thingModelId: "1",
    noticeAttrs: {telemetry_data:true}

}))