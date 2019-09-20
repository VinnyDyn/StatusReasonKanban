# StatusReason Kanban

Convert a simple view to a Kanban.

![alt text](https://github.com/VinnyDyn/StatusReasonKanban/blob/master/Images/control-presentation.gif)

### Enable To
- Entities
- Views
- Sub Grids

<img src="https://github.com/VinnyDyn/StatusReasonKanban/blob/master/Images/control-details.png" width="200" height="200"/>

### Prerequisites
The component needs that the attribute statuscode is present on the view.

### Features
- All options are based on statusocde.
- Drag and drop the cards between the status.
- Colors respect the option set definitions.
- Attributes will be displayed based on the associated view and if they has value.
- With a double click, access the form record.

### Incompatible with
- Specials status change: WonOpportunity, IncidentResolution, CloseQuoteRequest, etc..
- Views without the attribute statuscode.
