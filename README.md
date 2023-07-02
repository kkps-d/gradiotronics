# Gradiotronics
```
This repo contains the source code for the web-app part of the senior project, optimized to be served with GitHub pages.
A separate zip file containing the original repo is also uploaded.
Original README.md below. Dead links have been removed.
```

## Links
- Software Kanban & Timeline
- Hardware Timeline 
- Snapshots

## Members
**Chelsea Igtanloc**   
**Kaung Khant Pyae Sone**  
**Joaquin Gonzalez**  
**Vicky Guan**  

## Description
At Gradiotronics, we are building an insole force sensor that allows us to measure the rate of 
force development (RFD) of an athlete. Rate of force development (RFD) is a measure of how 
fast an athlete can produce force. The sensor is based on an Arduino, and it stores the data 
it has recorded to an SD card, and also transmits data over Bluetooth Low Energy (BLE) to a 
computer.  

This project mainly focuses on creating an application that interfaces and obtains data from the 
sensor/Arduino, either over serial, .csv files on the SD card, or over BLE, and visualizing the 
data in a way that is suitable for conducting RFD research.

## Features
- Load sensor data from an Arduino via saved `.csv` files, USB serial (mainly for debugging) or over Bluetooth Low Energy (BLE)
- Visualize data through heatmaps and graphs, with data being either real-time values (via serial or BLE), or recorded data via `.csv` files stored onboard the Arduino

## Requirements - Current web-app
### Hardware
- Bluetooth 4.0+, MUST support Bluetooth Low Energy (BLE)

### Software
- Browser that supports the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API)
- Windows 10 & 11 / macOS 10.15+

## Requirements - Former Electron App
### Hardware
- Bluetooth 4.0+, MUST support Bluetooth Low Energy (BLE)
- USB 2.0+ for USB serial

### Software
- Node.js version v18.14.1 
- Windows 10/11
