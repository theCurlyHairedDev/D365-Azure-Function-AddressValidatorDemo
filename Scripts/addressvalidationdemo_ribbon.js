function validateAddress(primaryControl) {
    var formContext = primaryControl;

    // Create the address object with the exact field names expected by the flow
    var address = {
        street1: formContext.getAttribute("abus_street1").getValue() || "",
        street2: formContext.getAttribute("abus_street2").getValue() || "",
        city: formContext.getAttribute("abus_city").getValue() || "",
        stateOrProvince: formContext.getAttribute("abus_stateorprovince").getValue() || "",
        postalCode: formContext.getAttribute("abus_postalcode").getValue() || "",
        country: formContext.getAttribute("abus_country").getValue() || ""
    };

    Xrm.Utility.showProgressIndicator("Validating address...");

    var powerAutomateUrl = "https://prod-59.westus.logic.azure.com:443/workflows/2a5075d0e1444f79bb25c9ac04fc619b/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=W5Q17sgQxtYohRpVC4WTS9n28c5boePb_rwmtGGOAHA";

    var req = new XMLHttpRequest();
    req.open("POST", powerAutomateUrl, true);
    req.setRequestHeader("Content-Type", "application/json");

    req.onerror = function () {
        Xrm.Utility.closeProgressIndicator();
        Xrm.Utility.alertDialog("An error occurred while validating the address. Please try again later.");
    };

    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            Xrm.Utility.closeProgressIndicator();
            console.log("Response status:", this.status);
            console.log("Response text:", this.responseText);

            if (this.status === 200) {
                try {
                    var result = JSON.parse(this.response);
                    if (result.IsValid) {
                        // Address is valid
                        Xrm.Utility.alertDialog("Address has been validated successfully!");
                        // Store validation status and formatted address if available
                        formContext.getAttribute("abus_addressvalidated").setValue(true);
                        if (result.FormattedAddress) {
                            // If you have a field to store the formatted address
                            formContext.getAttribute("abus_formattedaddress").setValue(result.FormattedAddress);
                        }
                    } else {
                        // Address is invalid
                        var suggestionMsg = "The address couldn't be validated.\n\n";
                        if (result.Suggestions && result.Suggestions.length > 0) {
                            suggestionMsg += result.Suggestions[0];
                        }
                        Xrm.Utility.alertDialog(suggestionMsg);
                        formContext.getAttribute("abus_addressvalidated").setValue(false);
                    }
                } catch (e) {
                    // JSON parsing error
                    console.error("JSON parsing error:", e);
                    console.error("Response that caused error:", this.responseText);
                    Xrm.Utility.alertDialog("Error processing the validation results.");
                }
            } else {
                // Generic error for any non-200 response
                console.error("Error response:", this.status, this.responseText);
                Xrm.Utility.alertDialog("An error occurred while validating the address. Please try again later.");
            }
        }
    };

    // Log what we're sending for debugging
    console.log("Sending address payload:", JSON.stringify(address));

    // Add try-catch for the actual sending of the request
    try {
        req.send(JSON.stringify(address));
    } catch (e) {
        Xrm.Utility.closeProgressIndicator();
        console.error("Error sending request:", e);
        Xrm.Utility.alertDialog("An error occurred while validating the address. Please try again later.");
    }
}