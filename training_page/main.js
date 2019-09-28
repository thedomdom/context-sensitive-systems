// Imports
const Influx = require('influx');

// Global variable for Influx DB
const influx = new Influx.InfluxDB({
    host: '192.168.43.60',
    database: 'training'
});

console.log("Test");

// Global variable to store current values.
let orientation_buf;

// Global variable for writing interval object.
let interval;


//make constructor to easily initialize all arrays
function OrientationValues() {
    return {
        alpha: [],
        beta: [],
        gamma: [],
    }
}

orientation_buf = new OrientationValues(); // start empty

const UPLOAD_RATE = 20; // How many data points are uploaded per second?
let dataCount = 0; // How many data points have been recorded/uploaded so far?

let write = function () {
    if (orientation_buf.alpha.length > 0) {
        dataCount++;

        let v = orientation_buf; //copy old buffer to var to avoid async effects on write
        orientation_buf = new OrientationValues(); // reset buffer

        function milli_mean_int(values) {
            let sum = values.reduce(function (a, b) {
                return a + b;
            });
            return Math.floor(sum * 1000 / values.length);
        }

        let labelDropdown = document.getElementById("label");

        let point = {
            measurement: "orientation",
            tags: {
                label: labelDropdown.options[labelDropdown.selectedIndex].text,
                subject: document.getElementById("subject").value
            },
            fields: {
                count: dataCount, // debug var to identify missing values...
                alpha: milli_mean_int(v.alpha), //use mean * 1000 (int for efficiency)
                beta: milli_mean_int(v.beta),
                gamma: milli_mean_int(v.gamma)
            }
        };

        influx.writePoints([
            point
        ]).then(function () {
            document.getElementById("debug").innerHTML = "Saved entry to Database! (" + dataCount + ")";
        })

    } else {
        document.getElementById("debug").innerHTML = "OrientationBuffer is empty!"
    }
};

startRecording = function () {
    document.getElementById("debug").innerHTML = "Starting Recording...";
    let label = document.getElementById("label").value;

    if (label) {
        // If training label is selected
        window.clearInterval(interval);

        // Write DeviceOrientation to buffer
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', function (orientation) {
                // Read and store all acceleration and rotation values.
                if (!isNaN(parseFloat(orientation.alpha))) {
                    orientation_buf.alpha.push(orientation.alpha);
                }
                if (!isNaN(parseFloat(orientation.beta))) {
                    orientation_buf.beta.push(orientation.beta);
                }
                if (!isNaN(parseFloat(orientation.gamma))) {
                    orientation_buf.gamma.push(orientation.gamma);
                }
            }, false);
            interval = window.setInterval(write, 1000 / UPLOAD_RATE);
        } else {
            document.getElementById("debug").innerHTML = "DeviceOrientation not supported.";
        }

    } else {
        // If no training label is selected
        this.checked = false;
        document.getElementById("debug").innerHTML = "Select training label first!";
    }
};

const stopRecording = function () {
    window.clearInterval(interval);
    write();
    document.getElementById("debug").innerHTML = "Not recording.";
    dataCount = 0;
};

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("subject").value=Math.floor((1 + Math.random()) * 0x10000).toString(16); //pick a random id

    document.getElementById('record').onchange = function () {
        if (this.checked) {
            // If slider activated
            startRecording();

        } else {
            // If slider deactivated
            stopRecording()
        }
    }
});