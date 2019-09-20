export class Helper
{
    public static CorrectEntityLogicalName(logicalName : string) : string
    {
        switch(logicalName)
        {
            case "opportunity":
                logicalName = "opportunities";
            break;
            
            default:
                logicalName += "s";
            break;
        }

        return logicalName;
    }
}