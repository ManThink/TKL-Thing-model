function rpc_script({device, values}) {
    let classMode = (device && device.shared_attrs && device.shared_attrs.class_mode) || "ClassA";
    let sleepMs = classMode === "ClassA" ? 0 : 5000;
    let isClassA = classMode === "ClassA";

    function processSubAddr(subAddr, subAddrSize, isHex) {
        let num;
        try {
            num = isHex ? parseInt(subAddr, 16) : parseInt(subAddr, 10);
            if (isNaN(num)) { throw new Error("Invalid number"); }
        } catch (e) { num = 0; }
        subAddrSize = Number(subAddrSize) || 1;
        const buffer = Buffer.alloc(subAddrSize);
        let hexStr = num.toString(16);
        if (hexStr.length % 2 !== 0) { hexStr = '0' + hexStr; }
        const numBuffer = Buffer.from(hexStr, 'hex');
        if (numBuffer.length > subAddrSize) {
            console.warn('subAddr ' + subAddr + ' exceeds size ' + subAddrSize + ', truncating');
        }
        const startPos = Math.max(0, numBuffer.length - subAddrSize);
        const offset = Math.max(0, subAddrSize - numBuffer.length);
        numBuffer.copy(buffer, offset, startPos);
        return buffer;
    }

    function encode(values) {
        let queryIndex = values.query_index || 0;
        let subAddrSize = values.sub_addr_size || 1;
        let deviceCounts = 0;
        for (let i = 1; i <= 6; i++) {
            if (!values['sub_addr' + i]) { break; }
            const saddr = values['sub_addr' + i].trim().toLowerCase();
            if (saddr=== ""||saddr=="nc") {
                break;
            }
            deviceCounts++;
        }
        let buffer = Buffer.alloc(6 + subAddrSize * deviceCounts);
        buffer[0] = 0xCF;
        buffer[1] = 4 + subAddrSize * deviceCounts;
        buffer[2] = 120;
        buffer[3] = subAddrSize * deviceCounts+2;
        buffer.writeUInt8(queryIndex, 4);
        buffer.writeUInt8(subAddrSize, 5);
        for (let i = 0; i < deviceCounts; i++) {
            const subAddr = values['sub_addr' + (i + 1)];
            const payload = processSubAddr(subAddr, subAddrSize, values.is_hex);
            payload.copy(buffer, 6 + i * subAddrSize);
        }
        let devCountsBuffer = Buffer.from([0xCF, 0x03, 0x3C, 0x01, deviceCounts]);
        return {
            subAddrReg: buffer.toString("base64"),
            deviceCounts: devCountsBuffer.toString("base64")
        };
    }

    let retData = encode(values);
    return [
        {
            sleepTimeMs: 0,
            dnMsg: {
                "version": "3.0",
                "type": "data",
                "if": "loraWAN",
                "moteeui": device.eui,
                "token": new Date().getTime(),
                "userdata": {
                    "confirmed": isClassA,
                    "fpend": false,
                    "port": 214,
                    "TxUTCtime": "",
                    "payload": retData.subAddrReg,
                    "dnWaitms": 3000,
                    "type": "data",
                    "intervalms": 0
                }
            }
        },
        {
            sleepTimeMs: sleepMs,
            dnMsg: {
                "version": "3.0",
                "type": "data",
                "if": "loraWAN",
                "moteeui": device.eui,
                "token": new Date().getTime(),
                "userdata": {
                    "confirmed": true,
                    "fpend": false,
                    "port": 214,
                    "TxUTCtime": "",
                    "payload": retData.deviceCounts,
                    "dnWaitms": 3000,
                    "type": "data",
                    "intervalms": 0
                }
            }
        }
    ];
}
console.log(rpc_script(
    {
        device:{},
        values:{
            sub_addr1:"1234"
        }
    },
))