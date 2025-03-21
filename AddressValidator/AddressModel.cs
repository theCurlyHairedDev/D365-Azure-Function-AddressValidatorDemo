namespace AddressValidator
{
    public class AddressModel
    {
        public string Street1 { get; set; }
        public string Street2 { get; set; }
        public string City { get; set; }
        public string StateOrProvince { get; set; }
        public string PostalCode { get; set; }
        public string Country { get; set; }
    }

    public class AddressValidationResult
    {
        public bool IsValid { get; set; }
        public string[] Suggestions { get; set; }
        public string FormattedAddress { get; set; }
    }
}