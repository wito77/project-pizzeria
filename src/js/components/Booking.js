import { settings, select, templates } from '../settings.js';
import { utils } from '../utils.js';
import { AmountWidget } from './AmountWidget.js';
import { DatePicker } from './DatePicker.js';
import { HourPicker } from './HourPicker.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
  }

  render(element) {
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.generatedDOM = utils.createDOMFromHTML(generatedHTML);
    // console.log(generatedHTML);
    // thisBooking.appendChild(generatedDOM);
    thisBooking.dom.peopleAmount = thisBooking.generatedDOM.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.generatedDOM.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.generatedDOM.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.generatedDOM.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.wrapper.appendChild(thisBooking.generatedDOM);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
  }

  getData() {
    const thisBooking = this;

    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

    const params = {
      booking: utils.queryParams(startEndDates),
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };

    console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };

    console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function ([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]) {
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    console.log('eventsCurrent', eventsCurrent);

    for (let event of eventsCurrent) {
      console.log(event);
      thisBooking.makeBooked(event.date, event.hour, event.duration, event.table);
    }

    for (let event of bookings) {
      thisBooking.makeBooked(event.date, event.hour, event.duration, event.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let event of eventsRepeat) {
      if (event.repeat == 'daily') {
        for (let eventDate = minDate; eventDate <= maxDate; eventDate = utils.addDays(eventDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(eventDate), event.hour, event.duration, event.table);
          // console.log(eventDate);
        }
      }
    }
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;
    if (typeof (thisBooking.booked[date]) == 'undefined') {
      thisBooking.booked[date] = {};
    }
    // console.log(thisBooking.booked[date]);

    const bookedHour = utils.hourToNumber(hour);

    for (let hourBlock = bookedHour; hourBlock < bookedHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
        // console.log('thisBooking.booked[date][hourBlock]: ', thisBooking.booked[date][hourBlock]);
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }
}
