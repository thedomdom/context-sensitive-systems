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
points = [];

const UPLOAD_RATE = 20; // How many data points are uploaded per second?

let write = function () {
    if (orientation_buf.alpha.length > 0) {
        document.getElementById("debug").innerHTML = "OrientationBuffer is filled!";

        let v = orientation_buf; //copy old buffer to var to avoid async effects on write
        orientation_buf = new OrientationValues(); // reset buffer

        function milli_mean_int(values) {
            //use mean * 1000 (int for efficiency)
            let sum = values.reduce(function (a, b) {
                return a + b;
            });
            return Math.floor(sum * 1000 / values.length);
        }

        let point = {
            alpha: milli_mean_int(v.alpha),
            beta: milli_mean_int(v.beta),
            gamma: milli_mean_int(v.gamma)
        };

        points.push(point);

        while (points.length > 20) {
            points.shift();
        }

    } else {
        document.getElementById("debug").innerHTML = "OrientationBuffer is empty!";
    }
};

function aggregateTimestamps() {
    const recentPoints = points.slice(0, 20);
    // console.log(recentPoints.length);

    let alphas = recentPoints.map(recentPoint => recentPoint.alpha);
    let betas = recentPoints.map(recentPoint => recentPoint.beta);
    let gammas = recentPoints.map(recentPoint => recentPoint.gamma);

    const min = arr => {
        let minimum = arr[0];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] < minimum) {
                minimum = arr[i];
            }
        }
        return minimum;
    };

    const max = arr => {
        let maximum = arr[0];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] > maximum) {
                maximum = arr[i];
            }
        }
        return maximum;
    };

    const median = arr => {
        const mid = Math.floor(arr.length / 2),
            nums = [...arr].sort((a, b) => a - b);
        return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };

    const std = arr => {
        let getMean = function (arr) {
            return arr.reduce(function (a, b) {
                return Number(a) + Number(b);
            }) / arr.length;
        };
        let m = getMean(arr);
        return Math.sqrt(arr.reduce(function (sq, n) {
            return sq + Math.pow(n - m, 2);
        }, 0) / arr.length);
    };

    const aggregatedFeatures = [];
    // const features = [
    //     'alpha_min', 'alpha_max', 'alpha_median', 'alpha_std',
    //     'beta_min', 'beta_max', 'beta_median', 'beta_std',
    //     'gamma_min', 'gamma_max', 'gamma_median', 'gamma_std'
    // ];

    aggregatedFeatures.push(min(alphas));
    aggregatedFeatures.push(max(alphas));
    aggregatedFeatures.push(median(alphas));
    aggregatedFeatures.push(std(alphas));

    aggregatedFeatures.push(min(betas));
    aggregatedFeatures.push(max(betas));
    aggregatedFeatures.push(median(betas));
    aggregatedFeatures.push(std(betas));

    aggregatedFeatures.push(min(gammas));
    aggregatedFeatures.push(max(gammas));
    aggregatedFeatures.push(median(gammas));
    aggregatedFeatures.push(std(gammas));

    return aggregatedFeatures
}

// noinspection DuplicatedCode
const GaussianNB = function (priors, sigmas, thetas) {

    this.priors = priors;
    this.sigmas = sigmas;
    this.thetas = thetas;

    this.predict = function (features) {
        const likelihoods = new Array(this.sigmas.length);

        for (var i = 0, il = this.sigmas.length; i < il; i++) {
            var sum = 0.;
            for (var j = 0, jl = this.sigmas[0].length; j < jl; j++) {
                sum += Math.log(2. * Math.PI * this.sigmas[i][j]);
            }
            var nij = -0.5 * sum;
            sum = 0.;
            for (var j = 0, jl = this.sigmas[0].length; j < jl; j++) {
                sum += Math.pow(features[j] - this.thetas[i][j], 2.) / this.sigmas[i][j];
            }
            nij -= 0.5 * sum;
            likelihoods[i] = Math.log(this.priors[i]) + nij;
        }

        var classIdx = 0;
        for (var i = 0, l = likelihoods.length; i < l; i++) {
            classIdx = likelihoods[i] > likelihoods[classIdx] ? i : classIdx;
        }
        return classIdx;
    };

};

// noinspection DuplicatedCode
function predict(features) {
    // console.log(features.length); // = 12
    console.log(features);

    // Parameters:
    const priors = [0.33771106941838647, 0.3330206378986867, 0.32926829268292684];
    const sigmas = [[10175316781.667093, 8431395080.919674, 9637508012.106268, 2373125834.2689905, 714262088.543007, 1482989961.1859012, 630970687.075212, 241363455.04063514, 2345461273.9016504, 1658915069.3873847, 2208118090.17384, 484391888.7953987], [806925345.0738524, 880130715.2893, 841365230.4160618, 6542430.898090325, 133696868.27148697, 145984240.6452223, 138798055.56782886, 2506360.6973700295, 43665814.37367298, 45224790.71135203, 42057171.11823559, 1526273.6751891905], [10753328449.935232, 9478122967.97048, 10134444034.723894, 1752480684.889033, 42935037.3683079, 40329876.81159167, 40283268.470859826, 1358995.0653035801, 25376337.72371088, 25254649.792736273, 22855781.91546257, 714805.8512889117]];
    const thetas = [[107165.88888888889, 256424.85555555555, 187275.33055555556, 51657.33550055344, 30680.555555555555, 74075.33611111112, 50875.743055555555, 13528.848145078746, -24677.666666666668, 35688.01944444444, 3670.5055555555555, 19821.419861050887], [67111.65070422535, 72352.62535211268, 69724.62535211268, 1688.3775906331339, 27007.839436619717, 30144.16338028169, 28554.598591549297, 991.1625285656949, 6550.36338028169, 9512.0, 8057.204225352113, 932.1868643870566], [149626.9943019943, 227802.95726495725, 192075.5641025641, 27547.95582909525, 20907.00284900285, 29020.299145299145, 24944.972934472935, 2448.0158844377293, 3121.6068376068374, 8866.868945868946, 5925.323361823362, 1716.0142607646915]];

    // Estimator:
    const clf = new GaussianNB(priors, sigmas, thetas);
    const prediction = clf.predict(features);

    const classes = {
        0: "Running",
        1: "Walking",
        2: "Standing"
    };

    return classes[prediction];
}


function classify() {
    let aggregatedFeatures = aggregateTimestamps();
    let prediction = predict(aggregatedFeatures);

    let action;

    // switch (prediction) {
    //     case "Standing":
    //         action = "";
    //     case "Walking":
    //     case "Running":
    //         return;
    // }

    document.getElementById("debug").innerHTML = prediction;
}

// Start Measurements and trigger periodic uploads
const startClassifying = function () {
    document.getElementById("debug").innerHTML = "Starting Recording...";

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
        interval = window.setInterval(function () {
            write();
            classify();
        }, 1000 / UPLOAD_RATE);
    } else {
        document.getElementById("debug").innerHTML = "DeviceOrientation not supported.";
    }

};

document.addEventListener("DOMContentLoaded", function () {

    console.log("Standing " + predict([77768., 89825., 89740., 2588.54780671,
        18301., 25189., 24793., 1660.6643034,
        2780., 6808., 6545., 1072.14549475]));

    console.log("Walking " + predict([278658, 358056, 315049, 24725.12812483,
        22816, 29567, 25620, 2006.66899691,
        1472, 9505, 3347, 2933.21530559]));

    console.log("Running " + predict([132585., 312328., 175759., 74622.72233609,
        28323., 137265., 72207., 40879.27305945,
        -88350., 89351., 46774., 78890.31598009]));

    startClassifying();

});