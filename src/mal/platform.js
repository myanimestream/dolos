export function isMobilePage() {
    let mobilePage = null;
    if (mobilePage === null) {
        mobilePage = !!document.querySelector("a.footer-desktop-button");
    }
    return mobilePage;
}


export function setupPlatform() {
    console.log("settings up platform");
    if (isMobilePage()) {
        console.log("running on mobile version");
        alert("The mobile version of this script is still in development.");
    }
}