const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const Power = imports.ui.status.power;
const UPower = imports.gi.UPowerGlib;

let percentageText;
let signalId;

const SHOW_ON_CHARGING = true;
const SHOW_ON_BATERY = true;
const SHOW_REMAINING_TIME_CHARGING = false;
const SHOW_REMAINING_TIME_ON_BATTERY = true;

function init() {
}

function getPower() {
    return Main.panel.statusArea["aggregateMenu"]._power;
}

function getTimeFromSeconds(seconds) {
		let time = Math.round(seconds / 60);
		let minutes = time % 60;
		let hours = Math.floor(time / 60);

		return {
			minutes: minutes,
			hours: hours
		}
}

function getTimeString(timeObject, percentage, showRemainingTime) {
	if (showRemainingTime) {
		return _("%d\u2236%02d (%d%%)").format(timeObject.hours, timeObject.minutes, percentage);
	} else {
		return _("%d%%").format(percentage);
	}
}

function showText(currentState) {
	if(currentState == UPower.DeviceState.CHARGING) {
		return SHOW_ON_CHARGING;

	} else if (currentState == UPower.DeviceState.DISCHARGING) {
		return SHOW_ON_BATERY;

	} else {
		return SHOW_ON_BATERY && SHOW_ON_CHARGING;
	}
}

function _onPowerChanged() {
    if (this._proxy.IsPresent && showText(this._proxy.State)) {

        let time;
        let showRemainingTime;

        if (this._proxy.State == UPower.DeviceState.FULLY_CHARGED) {
            	time = getTimeFromSeconds(this._proxy.TimeToEmpty);
    		showRemainingTime = SHOW_REMAINING_TIME_ON_BATTERY && SHOW_REMAINING_TIME_CHARGING;

        } else if (this._proxy.State == UPower.DeviceState.CHARGING) {
    		time = getTimeFromSeconds(this._proxy.TimeToFull);
    		showRemainingTime = SHOW_REMAINING_TIME_CHARGING;

	} else if (this._proxy.State == UPower.DeviceState.DISCHARGING) {
		time = getTimeFromSeconds(this._proxy.TimeToEmpty);
    		showRemainingTime = SHOW_REMAINING_TIME_ON_BATTERY;

	} else {
		time = getTimeFromSeconds(0);
		showRemainingTime = false;

	}

        percentageText.set_text(getTimeString(time, this._proxy.Percentage, showRemainingTime));
        percentageText.show();
    } else {
        percentageText.hide();
    }
}

function enable() {
    let power = getPower();
    percentageText = new St.Label({ text: "", y_align: Clutter.ActorAlign.CENTER });
    power.indicators.add_child(percentageText);

    signalId = power._proxy.connect('g-properties-changed', Lang.bind(power, _onPowerChanged));
    _onPowerChanged.call(power);
}

function disable() {
    percentageText.destroy();
    getPower()._proxy.disconnect(signalId);
}
