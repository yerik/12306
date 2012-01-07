/*
  12306 Auto Query => A javascript snippet to help you book tickets online.
  12306 Booking Assistant
  Copyright (C) 2011 Hidden
 
  12306 Auto Query => A javascript snippet to help you book tickets online.
  Copyright (C) 2011 Jingqin Lynn
 
  12306 Auto Login => A javascript snippet to help you auto login 12306.com.
  Copyright (C) 2011 Kevintop
  
  Includes jQuery
  Copyright 2011, John Resig
  Dual licensed under the MIT or GPL Version 2 licenses.
  http://jquery.org/license
  
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
  
  You should have received a copy of the GNU General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 
 */

// ==UserScript==  
// @name         12306 Booking Assistant
// @author       zzdhidden@gmail.com
// @namespace    https://github.com/zzdhidden
// @description  A javascript snippet to help you booking train tickets at 12306.com
// @include      *://dynamic.12306.cn/otsweb/loginAction.do*
// @include		 *://dynamic.12306.cn/otsweb/order/querySingleAction.do*
// @require	https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==/UserScript== 

function withjQuery(callback, safe){
	if(typeof(jQuery) == "undefined") {
		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";

		if(safe) {
			var cb = document.createElement("script");
			cb.type = "text/javascript";
			cb.textContent = "jQuery.noConflict();(" + callback.toString() + ")(jQuery);";
			script.addEventListener('load', function() {
				document.head.appendChild(cb);
			});
		}
		else {
			var dollar = undefined;
			if(typeof($) != "undefined") dollar = $;
			script.addEventListener('load', function() {
				jQuery.noConflict();
				$ = dollar;
				callback(jQuery);
			});
		}
		document.head.appendChild(script);
	} else {
		callback(jQuery);
	}
}


withjQuery(function($){
	$(document).click(function() {
		if( window.webkitNotifications && window.webkitNotifications.checkPermission() != 0) {
			window.webkitNotifications.requestPermission();
		}
	});
	var notify = function(str, timeout) {
		if( window.webkitNotifications && window.webkitNotifications.checkPermission() == 0) {
			var notification = webkitNotifications.createNotification(
				null,  // icon url - can be relative
				'订票',  // notification title
				str
			);
			notification.show();
			if ( timeout ) {
				setTimeout(function() {
					notification.cancel();
				}, timeout);
			}
		} else {
			alert( str );
		}
	}
	if( window.location.href.indexOf("querySingleAction.do") != -1 ) {
		//query
		var isTicketAvailable = false;

		//The table for displaying tickets
		var tbl = $(".obj")[0];

		tbl.addEventListener("DOMNodeInserted", function() {
			if(checkTickets(event.target))
				{
					isTicketAvailable = true;
					highLightRow(event.target);
				}
				tbl.firstAppend=false;
		}, true);

		//Trigger the button
		var doQuery = function() {
			displayQueryTimes(queryTimes++);
			tbl.firstAppend = true;
			g.firstRemove = true;
			document.getElementById(isStudentTicket ? "stu_submitQuery" : "submitQuery").click();
		}

		var checkTickets = function(row) {
			var hasTicket = false;
			var canBook = true;
			$("td input[type=button]", row).each(function(i, e) {
				if(e.classList.contains("yuding_x")) {
					canBook = false;
				}
			});
			if(!canBook) return false;

			$("td", row).each(function(i, e) {
				if(ticketType[i-1]) {
					var info = e.innerText.trim();
					if(info != "--" && info != "无") {
						hasTicket = true;
						highLightCell(e);
					}
				}
			});

			return hasTicket;
		}

		//The box into which the message is inserted.
		var g = document.getElementById("gridbox");
		//When the message is removed, the query should be completed.
		g.addEventListener("DOMNodeRemoved", function() {
			if(g.firstRemove) {
				g.firstRemove = false;
				if (isTicketAvailable) {
					if (isAutoQueryEnabled)
						document.getElementById("refreshButton").click();
					onticketAvailable(); //report
				}
				else {
					//wait for the button to become valid
				}
			}
		}, true);

		//hack into the validQueryButton function to detect query
		var _validQueryButton = validQueryButton;

		validQueryButton = function() {
			_validQueryButton();
			if(isAutoQueryEnabled) doQuery();
		}

		var queryTimes = 0; //counter
		var isAutoQueryEnabled = false; //enable flag

		//please DIY:
		var audio = null;

		var onticketAvailable = function() {
			notify("可以订票了！");
			if(window.Audio) {
				if(!audio) {
					audio = new Audio("http://www.w3school.com.cn/i/song.ogg");
					audio.loop = true;
				}
				audio.play();
			}
		}
		var highLightRow = function(row) {
			$(row).css("background-color", "red");
		}
		var highLightCell = function(cell) {
			$(cell).css("background-color", "blue");
		}
		var displayQueryTimes = function(n) {
			document.getElementById("refreshTimes").innerText = n;
		};

		var isStudentTicket = false;

		//Control panel UI
		$("<div>请先选择好出发地，目的地，和出发时间。&nbsp;&nbsp;&nbsp;</div>").append(
			$("<input/>").attr("type", "checkBox").change(function(){
				isStudentTicket = this.checked;
			})
		).append(
			$("<span/>").html("学生票&nbsp;&nbsp;")
		).append(
			$("<button style='padding: 5px 10px; background: #2CC03E;border-color: #259A33;border-right-color: #2CC03E;border-bottom-color:#2CC03E;color: white;border-radius: 5px;text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.2);'/>").attr("id", "refreshButton").html("自动刷票").click(function() {
				if(!isAutoQueryEnabled) {
					isTicketAvailable = false;
					if(audio && !audio.paused) audio.pause();
					isAutoQueryEnabled = true;
					doQuery();
					this.innerText="停止刷票";
				}
				else {
					isAutoQueryEnabled = false;
					this.innerText="开始刷票";
				}
			})
		).append(
			$("<span>").html("&nbsp;&nbsp;尝试次数：").append(
				$("<span/>").attr("id", "refreshTimes").text("0")
			)
		).insertBefore($(".cx_title_w:first"));

		//Ticket type selector & UI
		var ticketType = new Array();
		$(".hdr tr:eq(2) td").each(function(i,e) {
			ticketType.push(false);
			if(i<3) return;
			ticketType[i] = true;

			var c = $("<input/>").attr("type", "checkBox").attr("checked", "true");
			c[0].ticketTypeId = i;
			c.change(function() {
				ticketType[this.ticketTypeId] = this.checked;
			}).appendTo(e);
		});
	}
	else if( window.location.href.indexOf("loginAction.do") != -1 ) {
		//login
		var url = "https://dynamic.12306.cn/otsweb/loginAction.do?method=login";
		var queryurl = "https://dynamic.12306.cn/otsweb/order/querySingleAction.do?method=init";
		function submitForm(){
			var submitUrl = url;
			$.ajax({
				type: "POST",
				url: submitUrl,
				data: {
					"loginUser.user_name": $("#UserName").val()
				  , "user.password": $("#password").val()
				  , "randCode": $("#randCode").val()
				},
				timeout: 30000,
				//cache: false,
				//async: false,
				success: function(msg){
					if (msg.indexOf('请输入正确的验证码') > -1) {
						alert('请输入正确的验证码！');
					};
					if (msg.indexOf('当前访问用户过多') > -1) {
						reLogin();
					}
					else {
						notify('登录成功，开始查询车票吧！');
						location.replace(queryurl);
					};
				},
				error: function(msg){
					reLogin();
				},
				beforeSend: function(XHR){
					//alert("Data Saved: " + XHR);
				}
			});
		}

		var count = 1;
		function reLogin(){
			count ++;
			$('#refreshButton').html("("+count+")次登录中...");
			setTimeout(submitForm, 2000);
		}
		//初始化
		$("#subLink").after($("<a href='#' style='padding: 5px 10px; background: #2CC03E;border-color: #259A33;border-right-color: #2CC03E;border-bottom-color:#2CC03E;color: white;border-radius: 5px;text-shadow: -1px -1px 0 rgba(0, 0, 0, 0.2);'/>").attr("id", "refreshButton").html("自动登录").click(function() {
			count = 1;
			$(this).html("(1)次登录中...");
			notify('开始尝试登录，请耐心等待！', 4000);
			submitForm();
			return false;
		}));

		alert('如果使用自动登录功能，请输入用户名、密码及验证码后，点击自动登录，系统会尝试登录，直至成功！');
	}

}, true);
