# TKL (ThinkLink) Library for Thing Models and RPC

This repository contains the TKL (ThinkLink) library, which provides functionalities for creating and managing Thing Models and RPCs (Remote Procedure Calls) for IoT devices.

## Table of Contents

- [Introduction](#introduction)
- [Thing Model](#thing-model)
- [RPC Model](#rpc-model)
- [Communication Protocols](#communication-protocols)
- [Getting Started](#getting-started)
- [Contact Us](#contact-us)

## Introduction

ThinkLink (TKL) is a comprehensive and highly integrated IoT system designed for building efficient, secure, and scalable LoRaWAN solutions. It includes a complete LoRaWAN Network Server (NS) for centralized management of LoRaWAN devices and gateways, ensuring network stability and secure device access. TKL also supports data integration from third-party systems via the standard MQTT protocol, enabling unified management of multi-source data and enhancing the platform's openness and compatibility.

TKL offers significant deployment flexibility, allowing users to choose the most suitable deployment method based on project requirements and environmental characteristics:

- **Cloud Server**: Ideal for quick setup and scenarios without the need for local operational resources.
- **Edge Server (TKE)**: Meets the demands for data localization and low-latency communication, supporting private deployment.
- **Gateway-Embedded**: Embeds NS functionality directly into the gateway device for lightweight, low-cost local network management.

This integrated "cloud-edge-device" deployment capability enables TKL to flexibly adapt to various needs, from small-scale testing to large-scale enterprise applications.

### Core Functionalities

TKL provides a range of powerful functional modules covering the entire lifecycle of IoT applications, from device access to business analysis:

| Feature | Description |
| --- | --- |
| **Network Data Debugging** | Real-time monitoring of LoRaWAN gateway-side data (NS data) and NS output data (AS data) to help users quickly debug LoRaWAN sensors and identify communication issues. |
| **Thing Model** | Parses raw data from LoRaWAN or MQTT into structured application-layer data and supports visualization through tables, charts, or custom dashboards. |
| **RPC Model** | Enables remote configuration of device parameters and the sending of control commands for remote device management and maintenance. |
| **Asset Model** | Aggregates data from multiple devices through the Thing Model to form a higher-dimensional "asset" view for comprehensive data analysis and business insights. |
| **Sub-device Management** | Supports managing data from sub-devices read by DTUs or collection units via interfaces like RS-485 and M-Bus as independent devices. |
| **EB Cloud Compilation** | Compiles and downloads Embedded Business (EB) code in the cloud, simplifying the development and update process of embedded business logic. |
| **Alarm Model** | Supports setting alarm rules based on various data types and delivers alarm notifications through multiple channels (e.g., email, SMS). |
| **Linkage Model** | Implements automated linkage between devices, triggering corresponding actions based on preset conditions to enhance system intelligence. |
| **Protocol Integration** | Seamlessly integrates with mainstream protocols such as BACnet, Home Assistant, ThingsBoard, and Modbus TCP through flexible Thing Model configurations. |


## Thing Model

The Thing Model is a core module in the ThinkLink platform that defines the functionality and data structure of a device. It allows you to parse raw data from the LoRaWAN Network Server (NS) or other protocols into standardized application-layer data, such as telemetry and attributes, which can then be visualized in tables, charts, or dashboards.

### Creating a Thing Model

To create a new Thing Model, you need to provide a unique name that serves as its identifier. This name must be unique across the entire system. It is recommended to name it based on the device type or function (e.g., `TemperatureHumiditySensor_ModelA`). After creation, you can configure a parsing script to decode and map the uplink data.

### Parsing Script

The parsing script transforms raw data sent to ThinkLink into structured `telemetry_data` and `shared_attrs` for further application processing and display.

#### Input Parameters

The script is executed with the following input parameters:

| Parameter | Type | Description |
| --- | --- | --- |
| `device` | Object | The device object to which the message belongs, containing all its attributes and historical data. |
| `msg` | Object | The raw data packet from the LoRaWAN Application Server (AS). For MQTT access, this is the JSON message body. |
| `thingModelId` | String | The unique ID of the current Thing Model, used to retrieve historical telemetry data for the device associated with this model. |
| `noticeAttrs` | Object | Indicates which attribute changes triggered the notification event, used for conditional logic. |

> **Note**: If you have existing parsing scripts written for ChirpStack, you can select the **ChirpStack compatibility mode**. ThinkLink has adapted the interface, so you can simply copy your original code to run it seamlessly.

#### Telemetry Model Reference Code

Here is a typical parsing script example for a LoRaWAN temperature and humidity sensor that sends a 15-byte binary payload on port `11`:

```javascript
let payload = Buffer.from(msg?.userdata?.payload, "base64");
let preTelemetry = device?.telemetry_data?.[thingModelId];
let isTelemetry = false;
let period = 15;

if (!noticeAttrs.telemetry_data) {
    return {
        telemetry_data: null,
        server_attrs: null,
        shared_attrs: null,
    };
}

function parseTelemetry(payload) {
    // Validate port
    if (msg.userdata.port !== 11) {
        return null;
    }

    // Validate frame header: 0x21 0x07 0x03
    if (payload[0] !== 0x21 || payload[1] !== 0x07 || payload[2] !== 0x03) {
        return null;
    }

    // Validate payload length
    if (payload.length !== 15) {
        return null;
    }

    isTelemetry = true;
    period = payload.readUInt16LE(5);  // Period in seconds

    let status = "normal";
    if ((payload[7] & 0x01) !== 0) {
        status = "warning";
    }

    let temperature = Number(((payload.readUInt16LE(8) - 1000) / 10.00).toFixed(2));
    let humidity = Number((payload.readUInt16LE(10) / 10.0).toFixed(2));

    let vbat = payload.readUint8(12);
    vbat = Number((((vbat * 1.6) / 254) + 2.0).toFixed(2));  // Battery voltage calculation

    return {
        period: period,
        status: status,
        t: temperature,
        h: humidity,
        vbat: vbat,
        rssi: msg.gwrx[0].rssi,   // Gateway signal strength
        snr: msg.gwrx[0].lsnr     // Signal-to-noise ratio
    };
}

let appData = parseTelemetry(payload);

return {
    telemetry_data: appData,
    server_attrs: null,
    shared_attrs: isTelemetry ? { "period": period } : null
};
```

#### Return Value Format

The parsing script must return a JSON object with the following structure:

```javascript
return {
    telemetry_data: {    // Parsed telemetry data, or null if none
        "temperature": 23.5,
        "humidity": 60.2,
        "rssi": -85
    },
    server_attrs: null,  // Server-specific attributes, usually null
    shared_attrs: {      // Shared attributes (optional), often for configuration
        "heartbeat_interval": 30
    }
};
```

> **Note**:
> - All fields are required. If there is no corresponding data, set it explicitly to `null`.
> - Data in `shared_attrs` is persisted at the device level and can be used by other modules (e.g., linkage rules, alarm conditions).

## RPC Model

The RPC (Remote Procedure Call) Model in ThinkLink provides the capability to remotely control and configure LoRaWAN devices. By defining standardized RPCs, users can send commands to devices, set their working parameters, or trigger specific actions, enabling intelligent device operation and management.

### Creating an RPC

To create a new RPC command in the TKL platform, follow these steps:

1.  Navigate to **Model Management > RPC Model > New**.
2.  Configure the basic information and the script logic.

### Basic Information

-   **Alias**: The display name of the RPC, used to identify its function (e.g., "Set Reporting Interval," "Reboot Device").
-   **ID Name**: The identifier for the RPC that will be used when invoking it.

### Input Parameter Template

| Field | Description |
| --- | --- |
| **Field Identifier** | The variable name of the parameter in the script (i.e., the key in the `values` object). For example, `period` for the reporting interval. |
| **Alias** | The user-friendly name for the parameter in the UI, which improves readability. For example, "Reporting Interval (seconds)." |

### RPC Script

The TKL platform supports writing custom encoding scripts in JavaScript to convert user input into the data format required by the device's communication protocol. This data is then sent to the target device via a downlink message.

-   All user-input parameters are passed into the script through the `values` object.
-   The script must return an array containing the downlink message structure.
-   The downlink message is published as a JSON object to a specific MQTT topic for the device's LoRaWAN protocol stack to process.

```javascript
function encode(values) {
    let buffer = Buffer.from("CF043A020807", "hex");
    buffer.writeUInt16LE(values.period, 4);
    return buffer.toString("base64");
}

if (values.period < 0 || values.period > 0xFFFF) {
    return null;
}

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
                "confirmed": true,
                "fpend": false,
                "port": 214,
                "TxUTCtime": "",
                "payload": encode(values),
                "dnWaitms": 0,
                "type": "data",
                "intervalms": 0
            }
        }
    }
];
```

> **⚠️ Important**:
> - The actual protocol format must strictly follow the device manufacturer's documentation.
> - For Manthink devices, please refer to the official documentation: [https://mensikeji.yuque.com/staff-zesscp/gqdw7f/uyzkiq?singleDoc#](https://mensikeji.yuque.com/staff-zesscp/gqdw7f/uyzkiq?singleDoc#)

### Attaching and Executing an RPC

Once an RPC is created, it needs to be attached to a specific device to be used. This can be done in the device's details page under the "RPC" tab. After attaching the RPC, you can execute it by clicking the "Execute" button and providing the required parameters.

## Communication Protocols

Third-party platforms can interact with ThinkLink (TKL) for data exchange in two main ways: through the AS (Application Server) protocol for raw data access, or by subscribing to the data parsed by the Thing Model for higher-level integration.

### AS Protocol Access

The AS protocol is suitable for scenarios that require direct access to raw uplink data and supports MQTT-based message publishing and subscription.

-   **Uplink Data Subscription Topic**: `/v32/{tenant}/as/up/data/#`
    Third-party platforms can subscribe to this wildcard topic to receive raw uplink data from all devices under a specific tenant.

-   **Downlink Data Publishing Topic**: `/v32/{tenant}/as/dn/data/{devEui}`
    To send a downlink command to a specific device, replace `{tenant}` with the actual organization account (e.g., `"demo"`) and `{devEui}` with the device's unique DevEUI.

### Thing Model Data Interface

By using the Thing Model interface, the data received has already been parsed by the ThinkLink system according to the configured Thing Model, making it ready for direct use in business logic.

#### Telemetry Data

Telemetry data refers to sensor readings or other monitoring values reported by the device.

-   **Uplink Subscription Topic**: `/v32/{tenant}/tkl/up/telemetry/{eui}`
    -   `{tenant}`: The organization account (e.g., `demo`).
    -   `{eui}`: The device's EUI identifier.

-   **Data Format Example**:

    ```json
    {
      "eui": "a00000000000001",
      "thingModelId": "1",
      "thingModelIdName": "SE73",
      "telemetry_data": {
        "temp": 1.0,
        "hum": 2
      }
    }
    ```

#### RPC Control

Users can send Remote Procedure Call (RPC) commands via MQTT to configure device parameters or perform remote control actions.

-   **Downlink Topic**: `/v32/{tenant}/tkl/dn/rpc/{eui}`
    -   `{tenant}`: The organization account (e.g., `demo`).
    -   `{eui}`: The target device's EUI.

-   **Message Content Format**:

    ```json
    {
      "idName": "heart_period",
      "values": {
        "period": 15
      }
    }
    ```

    -   `idName`: The name of the RPC command defined in the Thing Model.
    -   `values`: The input parameter object for the device; set to `null` if no parameters are needed.

## Getting Started

To get started with the TKL library, you will need to have a ThinkLink environment set up. You can then use the provided Thing Model and RPC examples as a reference to build your own IoT applications.

1.  **Set up your ThinkLink environment**: Follow the instructions in the [ThinkLink V2 User Guide](https://mensikeji.yuque.com/staff-zesscp/gqdw7f/wmkobyripn6f2mkl?singleDoc#) to deploy your ThinkLink instance.
2.  **Create a Thing Model**: Define the data structure and parsing logic for your device as described in the [Thing Model](#thing-model) section.
3.  **Create an RPC Model**: Define the remote control commands for your device as described in the [RPC Model](#rpc-model) section.
4.  **Integrate with your application**: Use the [Communication Protocols](#communication-protocols) to interact with your devices and the ThinkLink platform.

## Contact Us

-   **TKL**: [https://thinklink.manthink.cn](https://thinklink.manthink.cn/#page1)
-   **Website**: [www.manthink.cn](http://www.manthink.cn/#page1)
-   **Email**: [info@manthink.cn](mailto:info@manthink.cn)
-   **Phone**: +86-15810684257



## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## References

1. [ThinkLink V2 User Guide (Chinese)](https://mensikeji.yuque.com/staff-zesscp/gqdw7f/oggevg89v8157g72)
2. [[EN] TKE13 ThinkLink-Edge Specification](https://mensikeji.yuque.com/staff-zesscp/gqdw7f/wmkobyripn6f2mkl?singleDoc#)

