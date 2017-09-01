(function (window, angular, undefined) {

    'use strict';

    angular.module('ts.datetimePicker', ['ts.pointerEventsNone'])
    angular.module('ts.datetimePicker').directive('tsDatetimePicker', DatetimePickerController);

    DatetimePickerController.$inject = ['$parse', '$timeout'];

    function DatetimePickerController ($parse, $timeout) {
        return {
            restrict: 'E',
            scope: {
                tsDatetimePicker: '=',
                scope: '=tsDatetimePickerScope',
                date: '=tsDatetimePickerDate',
                // show: '=tsDatetimePickerShow'
            },
            templateUrl: 'template/ts.datetimepicker.html',
            link: function ($scope, $element, $attributes) {
                var date = null;
                $scope.tsDatetimePicker = angular.extend({showTime: true, mode: "scroll"}, $scope.tsDatetimePicker);

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
                    if ($scope.tsDatetimePicker.showTime) {
                        var date = new Date($scope.year.value, $scope.month.value, $scope.day.value, $scope.hour.value, $scope.minute.value);
                    } else {
                        var date = new Date($scope.year.value, $scope.month.value, $scope.day.value);
                    }
                    $parse($scope.tsDatetimePicker.date).assign($scope.tsDatetimePicker.scope, date);
                    $scope.tsDatetimePicker.show = false;
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
    var minYear = 2000;
    var maxYear = 2020;
    var MINUTES_STEP = 5;

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
            animate(field.$element, coordinate, Math.abs(field.value - value) * 0.1);
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
                currentY = currentCoordinate = lastPositiveDeltaY = null;
            }
        });
    };

    angular.module('ts.datetimePicker').directive("dateScroll", DateScrollDirective);

    function DateScrollDirective() {

        var daysInMonth = function (year, month) {
            return (new Date(year, month + 1, 0)).getDate();
        };

        var directive = {
            bindToController: false,
            controller: DirectiveController,
            replace: true,
            restrict: 'E',
            scope: false,
            templateUrl: 'template/ts.datescroll.html'
        };

        return directive;

        DirectiveController.$inject = ['$scope', '$element', '$attrs', '$timeout'];

        function DirectiveController($scope, $element, $attrs, $timeout) {
            $scope.day.values = [];
            $scope.day.$element = $element.find('.dp-column-day .dp-ul');

            $scope.month.values = range(0, 11);
            $scope.month.$element = $element.find('.dp-column-month .dp-ul');

            $scope.year.values = range(minYear, maxYear);
            $scope.year.$element = $element.find('.dp-column-year .dp-ul');

            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                if (newValue) {
                    $timeout(function (){
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
    }

    angular.module('ts.datetimePicker').directive("timeScroll", TimeScrollDirective);

    function TimeScrollDirective() {

        var directive = {
            bindToController: false,
            controller: DirectiveController,
            replace: true,
            restrict: 'E',
            scope: false,
            templateUrl: 'template/ts.timescroll.html'
        };

        return directive;

        DirectiveController.$inject = ['$scope', '$element', '$timeout'];

        function DirectiveController($scope, $element, $timeout) {
            $scope.hour.values = range(0, 23);
            $scope.hour.$element = $element.find('.dp-column-hour .dp-ul');

            $scope.minute.values = range(0, 59, MINUTES_STEP);
            $scope.minute.$element = $element.find('.dp-column-minute .dp-ul');

            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                if (newValue) {
                    $timeout(function (){
                        animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                        animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value, MINUTES_STEP));
                    });
                } else {
                    animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                    animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value, MINUTES_STEP));
                }
            });

            bindEvents($scope, 'hour');
            bindEvents($scope, 'minute', MINUTES_STEP);
        }
    }

    /**
     * DatePicker & TimePicker Directives
     */
    angular.module('ts.datetimePicker').directive("datePicker", DatePickerDirective);

    function DatePickerDirective() {

        var directive = {
            bindToController: false,
            controller: DirectiveController,
            replace: true,
            restrict: 'E',
            scope: false,
            template: '<div class="datepicker"></div>'
        };

        return directive;

        DirectiveController.$inject = ['$scope', '$element'];

        function DirectiveController($scope, $element) {
            var datePicker = new DatePicker($element[0], {
                onDateChanged: function (date) {
                    $scope.day.value = date.getDate();
                    $scope.month.value = date.getMonth();
                    $scope.year.value = date.getFullYear();
                }
            });
            $scope.$on('$destroy', function() {
                datePicker.destroy();
            });
        }
    }

    angular.module('ts.datetimePicker').directive("timePicker", TimePickerDirective);

    function TimePickerDirective() {

        var directive = {
            bindToController: false,
            controller: DirectiveController,
            replace: true,
            restrict: 'E',
            scope: false,
            templateUrl: 'template/ts.timepicker.html'
        };

        return directive;

        DirectiveController.$inject = ['$scope', '$element'];

        function DirectiveController($scope, $element) {
            $scope.hour.values = range(8, 20);
            $scope.minute.values = range(0, 59, MINUTES_STEP);
            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                if (newValue) {
                    var rest = $scope.minute.value % MINUTES_STEP;
                    $scope.minute.value += rest === 0 ? 0 : MINUTES_STEP - rest;
                }
            });
        }
    }

})(window, window.angular);