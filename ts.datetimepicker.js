(function (window, angular, undefined) {

    'use strict';

    angular.module('ts.datetimePicker', ['ts.pointerEventsNone']);
    angular.module('ts.datetimePicker').directive('tsDatetimePicker', ['$parse', '$timeout', DatetimePickerController]);

    function DatetimePickerController ($parse, $timeout) {
        return {
            restrict: 'E',
            scope: {
                tsDatetimePicker: '=',
                scope: '=tsDatetimePickerScope',
                date: '=tsDatetimePickerDate',
                // show: '=tsDatetimePickerShow'
            },
            template: '' +
            '<div ng-show="tsDatetimePicker.show" class="modal" pointer-events-none>'+
            '   <div class="vertical-align">'+
            '       <div>'+
            '           <div class="modal-dialog modal-sm">'+
            '               <div class="modal-content clearfix">'+
            '                   <div class="dp">'+
            '                       <div class="dp-header">'+
            '                           <h4>{{\'DATE_AND_TIME\' | translate}}</h4>'+
            '                       </div>'+
            '                       <div ng-if="tsDatetimePicker.mode == \'scroll\'">'+
            '                           <date-scroll></date-scroll>'+
            '                       </div>'+
            '                       <div ng-if="tsDatetimePicker.mode == \'picker\'">'+
            '                           <date-picker></date-picker>'+
            '                       </div>' +
            '                       <div ng-if="tsDatetimePicker.showTime">' +
            '                           <span class="glyphicon glyphicon-time" aria-hidden="true"></span>' +
            '                           <div ng-if="tsDatetimePicker.mode == \'scroll\'">' +
            '                               <time-scroll minuteStep="{{ tsDatetimePicker.minuteStep }}"></time-scroll>' +
            '                           </div>' +
            '                           <div ng-if="tsDatetimePicker.mode == \'picker\'">' +
            '                               <time-picker minuteStep="{{ tsDatetimePicker.minuteStep }}"></time-picker>' +
            '                           </div>' +
            '                       </div>' +
            '                       <div class="dp-footer">' +
            '                           <button type="button" class="btn btn-default btn-sm" ng-click="onCancelClick()">{{\'CANCEL\' | translate}}</button>' +
            '                           <button type="button" class="btn btn-primary btn-sm" ng-click="onSetClick()">{{\'OK\' | translate}}</button>' +
            '                       </div>' +
            '                   </div>' +
            '               </div>' +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</div>' +
            '',
            //templateUrl: 'template/ts.datetimepicker.html',
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
            controller: ['$scope', '$element', '$attrs', '$timeout', DirectiveController],
            replace: true,
            restrict: 'E',
            scope: false,
            template : '' +
            '<div class="dp-widget dp-widget-date">' +
            '   <div class="dp-column dp-column-year">' +
            '       <div class="dp-ul-wrapper">' +
            '           <div class="dp-ul">' +
            '               <div ng-repeat="year in year.values" data-value="{{ year }}">{{ year }} </div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="dp-selected"></div>' +
            '   </div>' +
            '   <div class="dp-column dp-column-month">' +
            '       <div class="dp-ul-wrapper">' +
            '           <div class="dp-ul">' +
            '               <div ng-repeat="month in month.values" data-value="{{ month }}"> {{ ((month + 1) < 10) ? \'0\' + (month + 1) : (month + 1) }}</div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="dp-selected"></div>' +
            '   </div>' +
            '   <div class="dp-column dp-column-day">' +
            '       <div class="dp-ul-wrapper">' +
            '           <div class="dp-ul">' +
            '               <div ng-repeat="day in day.values" data-value="{{ day }}"> {{ (day < 10) ? \'0\' + day : day }}</div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="dp-selected"></div>' +
            '   </div>' +
            '</div>' +
            '',
            //templateUrl: 'template/ts.datescroll.html'
        };

        return directive;

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
            controller: ['$scope', '$element', '$timeout', '$attrs', DirectiveController],
            replace: true,
            restrict: 'E',
            scope: false,
            template : '' +
            '<div class="dp-widget dp-widget-time">' +
            '   <div class="dp-column dp-column-hour">' +
            '       <div class="dp-ul-wrapper">' +
            '           <div class="dp-ul">' +
            '               <div ng-repeat="hour in hour.values" data-value="{{ hour }}"> {{ hour < 10 ? \'0\' + hour : hour }}</div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="dp-selected"></div>' +
            '   </div>' +
            '   <div class="dp-column dp-column-minute">' +
            '       <div class="dp-ul-wrapper">' +
            '           <div class="dp-ul">' +
            '               <div ng-repeat="minute in minute.values" data-value="{{ minute }}">{{ minute < 10 ? \'0\' + minute : minute }}</div>' +
            '           </div>' +
            '       </div>' +
            '       <div class="dp-selected"></div>' +
            '   </div>' +
            '</div>' +
            '',
            //templateUrl: 'template/ts.timescroll.html'
        };

        return directive;

        function DirectiveController($scope, $element, $timeout, $attrs) {
            var minuteStep = $attrs.minuteStep ? $attrs.minuteStep : MINUTES_STEP;

            $scope.hour.values = range(6, 23);
            $scope.hour.$element = $element.find('.dp-column-hour .dp-ul');

            $scope.minute.values = range(0, 59, minuteStep);
            $scope.minute.$element = $element.find('.dp-column-minute .dp-ul');

            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                if (newValue) {
                    $timeout(function (){
                        animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                        animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value, minuteStep));
                    });
                } else {
                    animate($scope.hour.$element, getCoordinateByValue($scope.hour.$element, $scope.hour.value));
                    animate($scope.minute.$element, getCoordinateByValue($scope.minute.$element, $scope.minute.value, minuteStep));
                }
            });

            bindEvents($scope, 'hour');
            bindEvents($scope, 'minute', minuteStep);
        }
    }

    /**
     * DatePicker & TimePicker Directives
     */
    angular.module('ts.datetimePicker').directive("datePicker", [DatePickerDirective]);

    function DatePickerDirective() {

        var directive = {
            bindToController: false,
            controller: ['$scope', '$element', DirectiveController],
            replace: true,
            restrict: 'E',
            scope: false,
            template: '<div class="datepicker"></div>'
        };

        return directive;

        function DirectiveController($scope, $element) {
            var datePicker = new DatePicker($element[0], {
                onDateChanged: function (date) {
                    $scope.day.value = date.getDate();
                    $scope.month.value = date.getMonth();
                    $scope.year.value = date.getFullYear();
                }
            });
            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                var date = new Date();

                datePicker.setSelectedDate(new Date(
                    $scope.year ? $scope.year.value : date.getYear(),
                    $scope.month ? $scope.month.value : date.getMonth(),
                    $scope.day ? $scope.day.value : date.getDay()
                ));
            });
            $scope.$on('$destroy', function() {
                datePicker.destroy();
            });
        }
    }

    angular.module('ts.datetimePicker').directive("timePicker", [TimePickerDirective]);

    function TimePickerDirective() {
        var directive = {
            bindToController: false,
            controller: ['$scope', '$element', '$attrs', DirectiveController],
            replace: true,
            restrict: 'E',
            scope: false,
            template : '' +
            '<div class="timepicker">'+
            '   <select ng-model="hour.value" class="dp-timepicker-hour" ng-options="value for value in hour.values track by value"></select> : '+
            '   <select ng-model="minute.value" class="dp-timepicker-minute" ng-options="value for value in minute.values track by value"></select>'+
            '</div>' +
            '',
            //templateUrl: 'template/ts.timepicker.html'
        };

        var bindScroll = function(elementName, $scope){
            if($scope[elementName].element && $scope[elementName].values){
                $scope[elementName].element.bind("DOMMouseScroll mousewheel onmousewheel", function(event){
                    event.preventDefault();
                    event.stopPropagation();

                    var delta = Math.max(-1, Math.min(1, (event.originalEvent.deltaY || -event.originalEvent.deltaY)));

                    var index = $scope[elementName].values.indexOf($scope[elementName].value);

                    if(delta < 0){
                        if($scope[elementName].values[index -1]){
                            $scope[elementName].value = $scope[elementName].values[index -1];
                        }
                    } else if (delta > 0){
                        if($scope[elementName].values[index +1]){
                            $scope[elementName].value = $scope[elementName].values[index +1];
                        }
                    }

                    $scope.$apply();
                });
                return true;
            } else {
                return false;
            }
        };

        return directive;

        function DirectiveController($scope, $element, $attrs) {
            var minuteStep = $attrs.minuteStep ? $attrs.minuteStep : MINUTES_STEP;

            $scope.hour.values = [];
            range(6, 23).forEach(function(element, index) {
                $scope.hour.values.push(element < 10 ? '0' + element : element);
            });
            $scope.hour.element = $element.find(".dp-timepicker-hour");
            bindScroll('hour', $scope);

            $scope.minute.values = [];
            range(0, 59, minuteStep).forEach(function(element, index) {
                $scope.minute.values.push(element < 10 ? '0' + element : element);
            });
            $scope.minute.element = $element.find(".dp-timepicker-minute");
            bindScroll('minute', $scope);

            $scope.$watch('tsDatetimePicker.show', function (newValue) {
                if (newValue) {
                    var rest = $scope.minute.value % minuteStep;
                    $scope.minute.value += rest === 0 ? 0 : minuteStep - rest;
                }
                $scope.hour.value = $scope.hour.value < 10 ? '0' + $scope.hour.value : $scope.hour.value;
                $scope.minute.value = $scope.minute.value  < 10 ? '0' + $scope.minute.value : $scope.minute.value;
            });
        }
    }

})(window, window.angular);