be.triggers.trigger = function (triggerName, triggerData)
{
    be.util.log("Trigger Fired - " + triggerName, this);
    be.util.log(triggerData , this);
    $(be.util.widgetSelector).trigger(triggerName, {data: triggerData, eventHandled : []});
}