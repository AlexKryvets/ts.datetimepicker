(function (window) {
    'use strict';
    window.DatePicker = (function () {

        var DAYS_A_WEEK = 7;
        var MAX_WEEKS_IN_MONTH = 6;

        var months = {
            "ru": ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            "en": ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        };
        var days = {
            "ru": ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            "en": ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
        };

        var today = new Date();

        function isLeapYear(year) {
            return year % 4 === 0 && !(year % 100 === 0 && year % 400 != 0);
        }

        function monthDays(date) {
            var month = date.getMonth();
            var monthDays = [31, isLeapYear(date.getFullYear()) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            return monthDays[month]
        }

        function buildDay(node) {
            var _this = this;
            var firstDay = new Date(this.selectedDate);
            var currentDay = new Date(this.selectedDate);
            var data = node['data'];
            var cssClass = 'days-cell';
            var index;

            firstDay.setDate(1);
            index = (data.col + 1 + (data.row * DAYS_A_WEEK)) - firstDay.getDay();
            currentDay.setDate(index);
            var value = currentDay.getDate();

            /* Setup class */
            if (currentDay.getTime() === this.selectedDate.getTime()) {
                cssClass += ' selected';
            }
            if (index <= 0 || index > monthDays(this.selectedDate)) {
                cssClass += ' off';
            }
            node['class'] = cssClass;
            node['onclick'] = function () {
                _this.setSelectedDate(currentDay);
            };
            node['value'] = currentDay.getDate();
        }

        function buildNode(node) {
            var _this = this;

            function _build(node) {
                var element, i, max;

                /* Run before build */
                if ('beforebuild' in node) {
                    node['beforebuild'].call(_this, node);
                }

                /* Create the element */
                if (!('element' in node)) {
                    node['element'] = document.createElement(node['tag']);
                }

                /* Attach a data hash to the element */
                if ('data' in node) {
                    node['element'].data = node['data'];
                }

                /* Set css class. */
                if ('class' in node) {
                    node['element'].setAttribute('class', node['class']);
                }

                /* Set inner html. */
                if ('value' in node) {
                    if (typeof node['value'] === 'function') {
                        node['element'].innerHTML = node['value']();
                    }
                    else {
                        node['element'].innerHTML = node['value'];
                    }
                }

                /* Set onclick */
                if ('onclick' in node) {
                    node['element'].onclick = node['onclick'];
                }

                /* Go through children. */
                if ('children' in node) {
                    for (i = 0, max = node['children'].length; i < max; i++) {
                        node['element'].appendChild(_build(node['children'][i]));
                    }
                }

                return node['element'];
            }

            return _build(node);
        }

        function destroyNode(node) {
            function _destroy(node) {
                if ('children' in node) {
                    for (i = 0, max = node['children'].length; i < max; i++) {
                        _destroy(node['children'][i]);
                    }
                }

                /* Remove element from DOM. */
                node['element'].parentNode.removeChild(node['element']);
                /* Remove reference to invisible DOM element. */
                node['element'] = null;
                delete node['element'];

                return node;
            }

            return _destroy(node);
        }

        function DatePicker(element, options) {
            var _this = this;

            options = options || {};

            this.onDateChanged = options.onDateChanged;
            this.container = element;
            this.language = options.language || 'en';
            this.monthNames = options.monthNames || (months[this.language] || months['en']);
            this.dayNames = options.dayNames || (days[this.language] || days['en']);

            /* Calendar DOM element tree */
            this.elements = [];
            /* Year */
            this.elements[0] = {tag: 'div', children: [], class: 'year'};
            this.elements[0]['children'][0] = {
                tag: 'a', class: 'dec', onclick: function () {
                    _this.increaseMonth(-12);
                    return false;
                }
            };
            this.elements[0]['children'][1] = {
                tag: 'a', class: 'inc', onclick: function () {
                    _this.increaseMonth(12);
                    return false;
                }
            };
            this.elements[0]['children'][2] = {
                tag: 'label', value: function () {
                    return _this.selectedDate.getFullYear();
                }
            };
            /* Month */
            this.elements[1] = {tag: 'div', children: [], class: 'month'};
            this.elements[1]['children'][0] = {
                tag: 'button', class: 'dec', onclick: function () {
                    _this.increaseMonth(-1);
                    return false;
                }
            };
            this.elements[1]['children'][1] = {
                tag: 'button', class: 'inc', onclick: function () {
                    _this.increaseMonth(1);
                    return false;
                }
            };
            this.elements[1]['children'][2] = {
                tag: 'label',
                value: function () {
                    return _this.monthNames[_this.selectedDate.getMonth()];
                }
            };

            /* Calendar */
            this.elements[2] = {
                tag: 'table', children: [
                    {tag: 'thead', children: [{tag: 'tr', children: []}]},
                    {tag: 'tbody', children: []}
                ], class: 'calendar'
            };
            /* Day names */
            for (var i = 0; i < DAYS_A_WEEK; i++) {
                this.elements[2]['children'][0]['children'][0]['children'][i] = {
                    tag: 'th',
                    index: i,
                    value: function () {
                        return _this.dayNames[this.index];
                    }
                };
            }
            /* Dates */
            for (var i = 0; i < MAX_WEEKS_IN_MONTH; i++) {
                this.elements[2]['children'][1]['children'][i] = {tag: 'tr', children: [], class: 'days-row'}
                for (var j = 0; j < DAYS_A_WEEK; j++) {
                    this.elements[2]['children'][1]['children'][i]['children'][j] = {
                        tag: 'td',
                        data: {row: i, col: j},
                        beforebuild: buildDay
                    };
                }
            }

            /* Link DOM element with DatePicker instance. */
            this.container.datepicker = this;

            /* Initialize selected date */
            if (options.selectedDate) {
                this.setSelectedDate(options.selectedDate, true);
            } else {
                this.setSelectedDate(today);
            }
        }

        DatePicker.prototype.increaseMonth = function (amount) {
            /* Increase by one if no amount is passed. */
            amount = amount || 1;

            var month = this.selectedDate.getMonth();
            var newDate = new Date(this.selectedDate);

            newDate.setMonth(month + amount);

            return this.setSelectedDate(newDate);
        };

        DatePicker.prototype.decreaseMonth = function (amount) {
            return this.increasetMonth((amount * -1));
        };

        DatePicker.prototype.setSelectedDate = function (date, suppressCallback) {
            /* Throw error if no date is passed */
            if (!date || (!!this.selectedDate && this.selectedDate.getTime() === date.getTime())) {
                return;
            }

            this.selectedDate = date;
            this.build();
            if (typeof this.onDateChanged === 'function' && !suppressCallback) {
                this.onDateChanged(date);
            }

            return this.selectedDate;
        };

        DatePicker.prototype.setLanguage = function (language) {
            var monthNames = months[language];
            var dayNames = days[language];
            if (monthNames && dayNames) {
                this.language = language;
                this.monthNames = monthNames;
                this.dayNames = dayNames;
                this.build();
            }
        };

        DatePicker.prototype.build = function () {
            /* Build one by one */
            for (var i = 0, max = this.elements.length; i < max; i++) {
                this.container.appendChild(buildNode.call(this, this.elements[i]));
            }

            return this.container;
        };

        DatePicker.prototype.destroy = function () {
            for (var i = 0, max = this.elements.length; i < max; i++) {
                destroyNode.call(this, this.elements[i]);
            }

            /* Remove from DOM. */
            this.container.parentNode.removeChild(this.container);

            /* Destroy reference to invisible DOM element. */
            this.container = null;

            return this.selectedDate;
        };

        return DatePicker;

    }());
})(window);