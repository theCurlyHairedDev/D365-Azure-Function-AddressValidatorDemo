using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System;

namespace AddressValidator
{
    public class AddressValidator
    {
        private readonly ILogger _logger;

        public AddressValidator(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<AddressValidator>();
        }

        [Function("ValidateAddress")]
        public async Task<HttpResponseData> Run([HttpTrigger(AuthorizationLevel.Function, "get", "post")] HttpRequestData req)
        {
            _logger.LogInformation("C# HTTP trigger function processed a request.");

            var response = req.CreateResponse(HttpStatusCode.OK);
            //response.Headers.Add("Content-Type", "text/plain; charset=utf-8");

            //response.WriteString("Welcome to Azure Functions!");
            // Read request body
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            var address = JsonConvert.DeserializeObject<AddressModel>(requestBody);

            if (address == null)
            {
                response = req.CreateResponse(HttpStatusCode.BadRequest);
                response.WriteString("Please provide an address in the request body.");
                return response;
            }

            // Log the received data
            _logger.LogInformation($"Validating address: {address.Street1}, {address.City}, {address.StateOrProvince}, {address.PostalCode}, {address.Country}");
           
            var validationResult = await CallAddressValidationApi(address, _logger);

            //turn response.WriteAsJsonAsync(validationResult);
            response = req.CreateResponse(HttpStatusCode.OK);
            await response.WriteAsJsonAsync(validationResult);
            return response;
        }

        private static async Task<AddressValidationResult> CallAddressValidationApi(AddressModel address, ILogger log)
        {
            try
            {
                string authId = Environment.GetEnvironmentVariable("SmartyAuthId");
                string authToken = Environment.GetEnvironmentVariable("SmartyAuthToken");

                // Build the request URL (US verification endpoint)
                string url = $"https://us-street.api.smarty.com/street-address?auth-id={authId}&auth-token={authToken}";

                // Build the request body
                var requestData = new List<object>
                {
                    new {
                        street = address.Street1,
                        street2 = address.Street2,
                        city = address.City,
                        state = address.StateOrProvince,
                        zipcode = address.PostalCode,
                        candidates = 1
                    }
                };

                // Serialize the request
                string jsonRequest = JsonConvert.SerializeObject(requestData);
                StringContent content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

                var httpClient = new HttpClient();

                // Make the API call
                HttpResponseMessage response = await httpClient.PostAsync(url, content);

                // Process the response
                if (response.IsSuccessStatusCode)
                {
                    string jsonResponse = await response.Content.ReadAsStringAsync();
                    var results = JsonConvert.DeserializeObject<List<dynamic>>(jsonResponse);

                    // Check if we got a valid result
                    bool isValid = results != null && results.Count > 0 && results[0].delivery_line_1 != null;
                    string formattedAddress = isValid ?
                        $"{results[0].delivery_line_1}, {results[0].last_line}" : "";

                    return new AddressValidationResult
                    {
                        IsValid = isValid,
                        Suggestions = isValid ? new string[] { } : new string[] { "No valid address found" },
                        FormattedAddress = formattedAddress
                    };
                }
                else
                {
                    log.LogError($"API call failed with status code: {response.StatusCode}");
                    return new AddressValidationResult
                    {
                        IsValid = false,
                        Suggestions = new string[] { "Address validation service unavailable" },
                        FormattedAddress = ""
                    };
                }
            }
            catch (Exception ex)
            {
                log.LogError($"Exception in address validation: {ex.Message}");
                return new AddressValidationResult
                {
                    IsValid = false,
                    Suggestions = new string[] { "Error validating address" },
                    FormattedAddress = ""
                };
            }
        }
    }
}
