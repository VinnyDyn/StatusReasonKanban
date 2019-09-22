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

#### Ready to use
The [managed](https://github.com/VinnyDyn/StatusReasonKanban/releases/download/1.0.0/VinnyBControls_1_0_0_0_managed.zip) solution is ideal for non developers. Import and use.

#### Developers
The PCF call a Action (process) to obtain informations about the statuscode of entity, import the [unmanaged](https://github.com/VinnyDyn/StatusReasonKanban/releases/download/1.0.0/VinnyBControls_1_0_0_0.zip) solution with the action 'vnb_RetrieveOptionSetMetadata' to tests.

### Features
- All options are based on statusocde.
- Drag and drop the cards between the status.
- Colors respect the option set definitions.
- Attributes will be displayed based on the associated view and if they has value.
- With a double click, access the form record.

### Incompatible with
- Specials status change: WonOpportunity, IncidentResolution, CloseQuoteRequest, etc..
- Views without the attribute statuscode.

### \node_modules\@types\xrm\index.d.ts\Xrm.ExecuteResponse
Change the attribute body from 'string' to 'ReadableStream':
```typescript
 interface ExecuteResponse {
        /**
         * (Optional). Object.Response body.
         */
        body: ReadableStream;
```
