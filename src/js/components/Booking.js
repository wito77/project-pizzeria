import { select, templates } from '../settings.js';
import { utils } from '../utils.js';
import { AmountWidget } from './AmountWidget.js';

export class Booking {
  constructor(element) {
    const thisBooking = this;

    thisBooking.render(element);
    thisBooking.initWidgets();
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
    thisBooking.dom.wrapper.appendChild(thisBooking.generatedDOM);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
  }
}
