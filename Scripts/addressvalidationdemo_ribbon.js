function validateAddress(primaryControl) {
    var formContext = primaryControl;

    var address = {
        street1: formContext.getAttribute("abus_street1").getValue(),
        street2: formContext.getAttribute("abus_street2").getValue(),
        city: formContext.getAttribute("abus_city").getValue(),
        stateOrProvince: formContext.getAttribute("abus_stateorprovince").getValue(),
        postalCode: formContext.getAttribute("abus_postalcode").getValue(),
        country: formContext.getAttribute("abus_country").getValue()
    };

    Xrm.Utility.showProgressIndicator("Validating address...");
    var azureFunctionUrl = "https://agentibusazurelearning.azurewebsites.net/api/ValidateAddress?code=gwLf-uzKhT1xhtsr9EFabLSCuL7tQogzzsvYhimMMqfyAzFuprJ__Q==";
    var req = new XMLHttpRequest();

    req.open("POST", azureFunctionUrl, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Accept", "application/json");

    // Handle network errors
    req.onerror = function () {
        Xrm.Utility.closeProgressIndicator();
        Xrm.Utility.alertDialog("An error occurred while validating the address. Please try again later.");
    };

    req.onreadystatechange = function () {
        if (this.readyState === 4) {
            Xrm.Utility.closeProgressIndicator();

            if (this.status === 200) {
                try {
                    var result = JSON.parse(this.response);
                    if (result.IsValid) {
                        // Address is valid
                        Xrm.Utility.alertDialog("Address has been validated successfully!");
                        // Store validation status and formatted address if available
                        formContext.getAttribute("abus_addressvalidated").setValue(true);
                        if (result.formattedAddress) {
                            // If you have a field to store the formatted address
                            formContext.getAttribute("abus_formattedaddress").setValue(result.formattedAddress);
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
                    Xrm.Utility.alertDialog("Error processing the validation results.");
                }
            } else {
                // Generic error for any non-200 response
                Xrm.Utility.alertDialog("An error occurred while validating the address. Please try again later.");
            }
        }
    };

    // Add try-catch for the actual sending of the request
    try {
        req.send(JSON.stringify(address));
    } catch (e) {
        Xrm.Utility.closeProgressIndicator();
        console.error("Error sending request:", e);
        Xrm.Utility.alertDialog("An error occurred while validating the address. Please try again later.");
    }
}