import { Option } from "./Option";

export class Attribute
{
    constructor()
    {
        this.Options = new Array<Option>();
    }

    public LogicalName : string;
    public Label : string;
    public Options : Option[];
}