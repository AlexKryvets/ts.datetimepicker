(function (window, angular, undefined) {

    'use strict';

    angular.module('ts.datetimePicker', ['ts.pointerEventsNone']).directive('tsDatetimePicker', ['$parse', 'dateFilter', function ($parse, dateFilter) {

        var minYear = 2000;
        var maxYear = 2020;
        var HEIGHT = 40;

        var daysInMonth = function (year, month) {
            return (new Date(year, month + 1, 0)).getDate();
        };

        var range = function (start, end) {
            var array = [];
            for (; start <= end; array.push(start++));
            return array;
        };

        var getCoordinateByValue = function ($element, value) {
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
        }

        var bindEvents = function ($scope, fieldName) {
            var active = false;
            var currentY = null;
            var currentCoordinate = null;
            var field = $scope[fieldName];
            var timestamp = null;
            var lastPositiveDeltaY = null;
            field.$element.on('click', 'div', function (e) {
                var value = parseInt($(this).data('value'));
                var coordinate = getCoordinateByValue(field.$element, value);
                animate(field.$element, coordinate, Math.abs(field.value - value) * 0.1);
                field.value = value;
                $scope.$apply();
            });
            field.$element.on('mousedown touchstart', function (e) {
                active = true;
                currentY = getCoordinateY(e);
                currentCoordinate = getCoordinateByValue(field.$element, field.value);
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

        return {
            restrict: 'E',
            replace: true,
            scope: {
                scope: '=tsDatetimePickerScope',
                date: '=tsDatetimePickerDate',
                show: '=tsDatetimePickerShow'
            },
            templateUrl: 'template/ts.datetimepicker.html',
            link: function ($scope, $element, $attributes) {
                var date = new Date;

                $scope.day = {};
                $scope.day.values = [];
                $scope.day.$element = $element.find('.dp-column-day .dp-ul');

                $scope.month = {};
                $scope.month.values = range(0, 11);
                $scope.month.$element = $element.find('.dp-column-month .dp-ul');

                $scope.year = {};
                $scope.year.values = range(minYear, maxYear);
                $scope.year.$element = $element.find('.dp-column-year .dp-ul');

                $scope.hour = {};
                $scope.hour.values = range(0, 23);
                $scope.hour.$element = $element.find('.dp-column-hour .dp-ul');

                $scope.minute = {};
                $scope.minute.values = range(0, 59);
                $scope.minute.$element = $element.find('.dp-column-minute .dp-ul');

                $scope.$watch('daysInMonth', function (newValue, oldValue) {
                    $scope.day.values = range(1, newValue);
                    if (newValue < $scope.day.value) {
                        $scope.day.value = newValue;
                        animate($scope.day.$element, getCoordinateByValue($scope.day.$element, newValue), Math.abs(newValue - oldValue) * 0.1);
                    }
                });

                $scope.$watch('date', function () {
                    var newDate = $parse($scope.date)($scope.scope);
                    if (newDate instanceof Date) {
                        date = newDate;
                    }

                    $scope.day.value = date.getDate();
                    $scope.month.value = date.getMonth();
                    $scope.year.value = date.getFullYear();
                    $scope.hour.value = date.getHours();
                    $scope.minute.value = date.getMinutes();

                    animate($scope.year.$element, getCoordinateByValue($scope.year.$element, $scope.year.value));
                    animate($scope.month.$element, getCoordinateByValue($scope.month.$element, $scope.month.value));
                    animate($scope.day.$element, getCoordinateByValue($scope.day.$element, $scope.day.value));
                    animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                    animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value));
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
                bindEvents($scope, 'hour');
                bindEvents($scope, 'minute');

                $scope.onSetClick = function () {
                    date = new Date($scope.year.value, $scope.month.value, $scope.day.value, $scope.hour.value, $scope.minute.value);
                    $parse($scope.date).assign($scope.scope, date);
                    $scope.show = false;
                };

                $scope.onCancelClick = function () {
                    $scope.day.value = date.getDate();
                    $scope.month.value = date.getMonth();
                    $scope.year.value = date.getFullYear();
                    $scope.hour.value = date.getHours();
                    $scope.minute.value = date.getMinutes();
                    animate($scope.year.$element, getCoordinateByValue($scope.year.$element, $scope.year.value));
                    animate($scope.month.$element, getCoordinateByValue($scope.month.$element, $scope.month.value));
                    animate($scope.day.$element, getCoordinateByValue($scope.day.$element, $scope.day.value));
                    animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                    animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value));
                    $scope.show = false;
                };
            }
        };
    }]);

})(window, window.angular);