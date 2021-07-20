(function (window, angular, undefined) {

    'use strict';

    var translates = {
        "en": {
            "Date and time" : "Date and time",
            "Date" : "Date",
            "Cancel" : "Cancel"
        },
        "uk": {
            "Date and time" : "Дата і час",
            "Date" : "Дата",
            "Cancel" : "Скасувати"
        },
        "ru": {
            "Date and time" : "Дата и время",
            "Date" : "Дата",
            "Cancel" : "Отмена"
        }
    };

    angular.module('ts.datetimePicker', ['ts.pointerEventsNone']);

    angular.module('ts.datetimePicker').filter('trans', TranslateFilterFactory);

    TranslateFilterFactory.$inject = [];
    function TranslateFilterFactory() {
        var translateFilter = function (translationId, language) {
            return translates.hasOwnProperty(language) ? translates[language || 'en'][translationId] : translates['en'][translationId];
        };
        translateFilter.$stateful = true;
        return translateFilter;
    }

    angular.module('ts.datetimePicker').directive('tsDatetimePicker', DatetimePickerController);

    DatetimePickerController.$inject = ['$parse'];
    function DatetimePickerController($parse) {
        return {
            restrict: 'E',
            scope: {
                tsDatetimePicker: '='
            },
            templateUrl: 'template/ts.datetimepicker.html',
            link: function ($scope) {
                var date = null;
                $scope.tsDatetimePicker = angular.extend({
                    language: "en",
                    showTime: true,
                    mode: "scroll",
                    timeRange: {
                        min : {
                            hour: 0,
                            minute: 0
                        },
                        max : {
                            hour: 23,
                            minute: 59
                        }
                    },
                    minutesStep: 5,
                    onOutOfRange: function () {
                        throw new RangeError('Date out of accepted range.');
                    }
                }, $scope.tsDatetimePicker);

                $scope.day = {};
                $scope.month = {};
                $scope.year = {};
                $scope.hour = {};
                $scope.minute = {};

                $scope.$watch('tsDatetimePicker.show', function (newValue) {
                    if (newValue) {
                        var newDate = $parse($scope.tsDatetimePicker.date)($scope.tsDatetimePicker.scope);
                        date = (newDate instanceof Date) ? newDate : new Date;
                        $scope.year.value = date.getFullYear();
                        $scope.month.value = date.getMonth();
                        $scope.day.value = date.getDate();
                        $scope.hour.value = date.getHours();
                        $scope.minute.value = date.getMinutes();
                    }
                });

                $scope.onSetClick = function () {
                    var showTime = $scope.tsDatetimePicker.showTime;
                    if (showTime) {
                        var date = new Date($scope.year.value, $scope.month.value, $scope.day.value, $scope.hour.value, $scope.minute.value);
                    } else {
                        var date = new Date($scope.year.value, $scope.month.value, $scope.day.value);
                    }

                    var timeRange = $scope.tsDatetimePicker.timeRange;

                    var minDate = new Date(
                        $scope.year.value,
                        $scope.month.value,
                        $scope.day.value,
                        showTime ? timeRange.min.hour : 0,
                        showTime ? timeRange.min.minute : 0
                    );
                    var maxDate = new Date(
                        $scope.year.value,
                        $scope.month.value,
                        $scope.day.value,
                        showTime ? timeRange.max.hour : 0,
                        showTime ? timeRange.max.minute : 0
                    );

                    if (date >= minDate && date <= maxDate) {
                        $parse($scope.tsDatetimePicker.date).assign($scope.tsDatetimePicker.scope, date);
                        $scope.tsDatetimePicker.show = false;
                    } else {
                        $scope.tsDatetimePicker.onOutOfRange();
                    }
                };

                $scope.onCancelClick = function () {
                    $scope.day.value = date.getDate();
                    $scope.month.value = date.getMonth();
                    $scope.year.value = date.getFullYear();
                    $scope.hour.value = date.getHours();
                    $scope.minute.value = date.getMinutes();
                    $scope.tsDatetimePicker.show = false;
                };
            }
        };
    }

    /**
     * DateScroll & TimeScroll Directives
     */
    var HEIGHT = 40;
    const currentYear = new Date().getFullYear();
    var minYear = currentYear - 20
    var maxYear = currentYear + 10

    var range = function (start, end, step) {
        var array = [];
        for (; start <= end; array.push(start), start += step || 1);
        return array;
    };

    var getCoordinateByValue = function ($element, value, step) {
        step || (step = 1);
        var rest = value % step;
        value += rest === 0 ? 0 : step - rest;
        return HEIGHT - $element.find('[data-value="' + value + '"]').index() * HEIGHT;
    };

    var animate = function ($element, coordinate, timeout) {
        $element.css({
            'transition': '-webkit-transform ' + (timeout || 0) + 's ease-out',
            '-webkit-transition': '-webkit-transform ' + (timeout || 0) + 's ease-out'
        });
        $element.css({
            'transform': 'translate3d(0px, ' + coordinate + 'px, 0px)',
            '-webkit-transform': 'translate3d(0px, ' + coordinate + 'px, 0px)',
            '-moz-transform': 'translate3d(0px, ' + coordinate + 'px, 0px)'
        });
    };

    var getCoordinateY = function (event) {
        var touches = event.touches && event.touches.length ? event.touches : [event];
        var e = (event.changedTouches && event.changedTouches[0]) ||
            (event.originalEvent && event.originalEvent.changedTouches &&
            event.originalEvent.changedTouches[0]) ||
            touches[0].originalEvent || touches[0];

        return e.clientY;
    };

    var bindEvents = function ($scope, fieldName, step) {
        var active = false;
        var currentY = null;
        var currentCoordinate = null;
        var field = $scope[fieldName];
        var timestamp = null;
        var lastPositiveDeltaY = null;
        field.$element.on('click', 'div', function (e) {
            var value = parseInt($(this).data('value'));
            var coordinate = getCoordinateByValue(field.$element, value, step);
            animate(field.$element, coordinate, Math.abs(field.value - value) / (step || 1) * 0.1);
            field.value = value;
            $scope.$apply();
        });
        field.$element.on('mousedown touchstart', function (e) {
            active = true;
            currentY = getCoordinateY(e);
            currentCoordinate = getCoordinateByValue(field.$element, field.value, step);
        });
        field.$element.on('mousemove touchmove', function (e) {
            if (active) {
                var y = getCoordinateY(e);
                lastPositiveDeltaY = (currentY - y) || lastPositiveDeltaY;
                var newCoordinate = currentCoordinate - lastPositiveDeltaY;
                if (newCoordinate <= (3 * HEIGHT - 1) && newCoordinate >= -HEIGHT - (field.values.length - 1) * HEIGHT + 1) {
                    currentCoordinate = newCoordinate;
                    animate(field.$element, newCoordinate);
                    timestamp = Date.now()
                }
                currentY = y;
            }
        });
        field.$element.on('mouseup touchend mouseleave touchcancel', function (e) {
            if (active) {
                active = false;
                lastPositiveDeltaY = (currentY - getCoordinateY(e)) || lastPositiveDeltaY;
                var xFrames = Math.floor(lastPositiveDeltaY / (Date.now() - timestamp)) || 0;
                var newCoordinate = Math.round(currentCoordinate / HEIGHT - xFrames) * HEIGHT;
                if (newCoordinate > HEIGHT) {
                    newCoordinate = HEIGHT;
                } else if (newCoordinate < HEIGHT - (field.values.length - 1) * HEIGHT) {
                    newCoordinate = HEIGHT - (field.values.length - 1) * HEIGHT;
                }
                animate(field.$element, newCoordinate, Math.abs(newCoordinate - currentCoordinate) / HEIGHT * 0.1);
                field.value = field.values[1 - newCoordinate / HEIGHT];
                $scope.$apply();
                currentY = currentCoordinate = lastPositiveDeltaY = null
            }
        });
    };

    angular.module('ts.datetimePicker').directive("dateScroll", DateScrollDirective);

    function DateScrollDirective() {

        var daysInMonth = function (year, month) {
            return (new Date(year, month + 1, 0)).getDate();
        };

        DirectiveController.$inject = ['$scope', '$element', '$timeout'];
        function DirectiveController($scope, $element, $timeout) {
            $scope.day.values = [];
            $scope.day.$element = $element.find('.dp-column-day .dp-ul');

            $scope.month.values = range(0, 11);
            $scope.month.$element = $element.find('.dp-column-month .dp-ul');

            $scope.year.values = range(minYear, maxYear);
            $scope.year.$element = $element.find('.dp-column-year .dp-ul');

            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                if (newValue) {
                    $timeout(function () {
                        animate($scope.year.$element, getCoordinateByValue($scope.year.$element, $scope.year.value));
                        animate($scope.month.$element, getCoordinateByValue($scope.month.$element, $scope.month.value));
                        animate($scope.day.$element, getCoordinateByValue($scope.day.$element, $scope.day.value));
                    });
                } else {
                    animate($scope.year.$element, getCoordinateByValue($scope.year.$element, $scope.year.value));
                    animate($scope.month.$element, getCoordinateByValue($scope.month.$element, $scope.month.value));
                    animate($scope.day.$element, getCoordinateByValue($scope.day.$element, $scope.day.value));
                }
            });

            $scope.$watch('daysInMonth', function (newValue, oldValue) {
                $scope.day.values = range(1, newValue);
                if (newValue < $scope.day.value) {
                    $scope.day.value = newValue;
                    animate($scope.day.$element, getCoordinateByValue($scope.day.$element, newValue), Math.abs(newValue - oldValue) * 0.1);
                }
            });

            $scope.$watch('year.value', function (newValue, oldValue) {
                $scope.daysInMonth = daysInMonth(newValue, $scope.month.value);
            });
            $scope.$watch('month.value', function (newValue, oldValue) {
                $scope.daysInMonth = daysInMonth($scope.year.value, newValue);
            });

            bindEvents($scope, 'year');
            bindEvents($scope, 'month');
            bindEvents($scope, 'day');
        }

        var directive = {
            bindToController: false,
            controller: DirectiveController,
            replace: true,
            restrict: 'E',
            scope: false,
            templateUrl: 'template/ts.datescroll.html'
        };

        return directive;
    }

    angular.module('ts.datetimePicker').directive("timeScroll", TimeScrollDirective);

    function TimeScrollDirective() {

        DirectiveController.$inject = ['$scope', '$element', '$timeout'];
        function DirectiveController($scope, $element, $timeout) {
            var timeRange = $scope.tsDatetimePicker.timeRange;
            var minutesStep = $scope.tsDatetimePicker.minutesStep;

            $scope.hour.values = range(timeRange.min.hour, timeRange.max.hour);
            $scope.hour.$element = $element.find('.dp-column-hour .dp-ul');

            $scope.minute.values = range(0, 59, minutesStep);
            $scope.minute.$element = $element.find('.dp-column-minute .dp-ul');

            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                var rest = $scope.minute.value % $scope.tsDatetimePicker.minutesStep;
                var minuteValue = $scope.minute.value + (rest === 0 ? 0 : minutesStep - rest);
                $scope.minute.value = (minuteValue !== 60) ? minuteValue : minuteValue - minutesStep;
                if (newValue) {
                    $timeout(function () {
                        animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                        animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value));
                    });
                } else {
                    animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                    animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value));
                }
            });

            bindEvents($scope, 'hour');
            bindEvents($scope, 'minute', $scope.tsDatetimePicker.minutesStep);
        }

        var directive = {
            bindToController: false,
            controller: DirectiveController,
            replace: true,
            restrict: 'E',
            scope: false,
            templateUrl: 'template/ts.timescroll.html'
        };

        return directive;
    }

    /**
     * DatePicker & TimePicker Directives
     */
    angular.module('ts.datetimePicker').directive("datePicker", [DatePickerDirective]);

    function DatePickerDirective() {

        function DirectiveController($scope, $element) {
            var datePicker = new DatePicker($element[0], {
                language: $scope.tsDatetimePicker.language,
                onDateChanged: function (date) {
                    $scope.day.value = date.getDate();
                    $scope.month.value = date.getMonth();
                    $scope.year.value = date.getFullYear();
                }
            });
            $scope.$watch('tsDatetimePicker.language', function (newValue) {
                datePicker.setLanguage(newValue);
            });
            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                var date = new Date();

                datePicker.setSelectedDate(new Date(
                    $scope.year ? $scope.year.value : date.getYear(),
                    $scope.month ? $scope.month.value : date.getMonth(),
                    $scope.day ? $scope.day.value : date.getDay()
                ));
            });
            $scope.$on('$destroy', function () {
                datePicker.destroy();
            });
        }

        var directive = {
            bindToController: false,
            controller: ['$scope', '$element', DirectiveController],
            replace: true,
            restrict: 'E',
            scope: false,
            template: '<div class="datepicker"></div>'
        };

        return directive;
    }

    angular.module('ts.datetimePicker').directive("timePicker", [TimePickerDirective]);

    function TimePickerDirective() {

        var bindScroll = function (elementName, $scope) {
            if ($scope[elementName].element && $scope[elementName].values) {
                $scope[elementName].element.bind("DOMMouseScroll mousewheel onmousewheel", function (event) {
                    event.preventDefault();
                    event.stopPropagation();

                    var delta = Math.max(-1, Math.min(1, (event.originalEvent.deltaY || -event.originalEvent.deltaY)));

                    var index = $scope[elementName].values.indexOf($scope[elementName].value);

                    if (delta < 0) {
                        if ($scope[elementName].values[index - 1]) {
                            $scope[elementName].value = $scope[elementName].values[index - 1];
                        }
                    } else if (delta > 0) {
                        if ($scope[elementName].values[index + 1]) {
                            $scope[elementName].value = $scope[elementName].values[index + 1];
                        }
                    }

                    $scope.$apply();
                });
                return true;
            } else {
                return false;
            }
        };

        DirectiveController.$inject = ['$scope', '$element', '$timeout'];
        function DirectiveController($scope, $element, $timeout) {
            var timeRange = $scope.tsDatetimePicker.timeRange;
            var minutesStep = $scope.tsDatetimePicker.minutesStep;

            function initRanges(){
                $scope.hour.values = [];
                $scope.minute.values = [];

                timeRange = $scope.tsDatetimePicker.timeRange;

                $scope.hour.element = $element.find(".dp-timepicker-hour");
                range(timeRange.min.hour, timeRange.max.hour).forEach(function (element) {
                    $scope.hour.values.push((element < 10) ? '0' + element : element);
                });

                $scope.minute.element = $element.find(".dp-timepicker-minute");
                range(0, 59, minutesStep).forEach(function (element) {
                    $scope.minute.values.push((element < 10) ? '0' + element : element);
                });
            }

            $scope.hour.values = [];
            $scope.minute.values = [];
            initRanges();
            bindScroll('hour', $scope);
            bindScroll('minute', $scope);

            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                initRanges();

                $scope.hour.value = '' + $scope.hour.value;
                $scope.hour.value = $scope.hour.value.length == 1 < 10 ? '0' + $scope.hour.value : $scope.hour.value;
                var index_hour = $scope.hour.values.indexOf($scope.hour.value);
                if(index_hour == -1){
                    var prev_value = 0;
                    if(timeRange.max.hour < parseInt($scope.hour.value)){
                        $scope.hour.values.push($scope.hour.value);
                    } else {
                        $scope.hour.values.unshift($scope.hour.value);
                    }
                }

                $scope.minute.value = '' + $scope.minute.value;
                $scope.minute.value = $scope.minute.value.length == 1 ? '0' + $scope.minute.value : $scope.minute.value;
                var index_minute = $scope.minute.values.indexOf($scope.minute.value);
                if(index_minute == -1){
                    var prev_value = $scope.minute.value - $scope.minute.value % minutesStep;
                    var prev_index = $scope.minute.values.indexOf(prev_value < 10 ? '0' + prev_value : prev_value) + 1;
                    $scope.minute.values = Array.prototype.concat($scope.minute.values.slice(0,prev_index),[$scope.minute.value],$scope.minute.values.slice(prev_index));
                }
            });
        }

        var directive = {
            bindToController: false,
            controller: DirectiveController,
            replace: true,
            restrict: 'E',
            scope: false,
            templateUrl: 'template/ts.timepicker.html'
        };

        return directive;
    }

})(window, window.angular);
