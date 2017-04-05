//dependencies: jq, lodash
//lodash modules: map, find, filter, each, get, sortBy, ceil， isEmpty, cloneDeep, values, last

import {data} from './data';
import './luyeTable.less';
var $ = require('jquery');
var _ = require('lodash');

export default class LuyeTable {
  constructor(param) {
    console.log('get you');
    this.initialize(param);
  }

  initialize(param) {
    this.param = {
      el: null,
      data: null,
      url: null,
      columns: null,
      // optional
      dirtyCheck: false,
      export: true,
      pagination: true,
      pageCount: 20,
      globalSearch: true,
      manageColumns: false,
      //initial value lost at first evaluation
      managePageSize: true
    };

    $.extend(this.param, param);
    if (!(this.param.el instanceof $)) {
      this.param.el = $(this.param.el);
    }
    this.initData();
    this.metadata = {
      processingData: _.cloneDeep(this.param.data),
      processingColumns: _.cloneDeep(this.param.columns),
      currentData: null,
      currentPage: 1,
      pageTotal: 0
    };
    if (this.param.dirtyCheck) {
      this.checkDirtyData(this.param.data, this.metadata.processingColumns);
    }
    this.getCurrentData();
    if (!this.metadata.processingData) {
      alert('no data');
      return;
    }
    this.adjustContainer();
    this.render();
  }

  //自执行函数,随LuyeTable在初始化时执行
  // regGlobalClick() {
  //   var store = [];
  //   console.trace();
  //   $('body').on('click', function (evt) {
  //     store = _.filter(store, function (config) {
  //       var elEl = config.element,
  //         handler = config.handler;
  //       if ($.contains(document.body, elEl.get(0))) {
  //         if (handler) {
  //           handler(evt);
  //         } else {
  //           elEl.hide();
  //         }
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     });
  //   });
  //   return function (elSelector, handler) {
  //     console.trace();
  //     store.push({
  //       "element": $(elSelector),
  //       "handler": handler
  //     });
  //   };
  // }()
  initData() {
    if (this.param.url) {

    }
    else if (this.param.data) {

    }
    else {
      this.param.data = data.res;
    }
  }

  getCurrentData() {
    var pageStart = (this.metadata.currentPage - 1) * this.param.pageCount;
    var pageEnd = pageStart + this.param.pageCount;
    this.metadata.currentData = this.metadata.processingData.slice(pageStart, pageEnd);
  }

  //in case that provided data has more attributes than the table needs
  checkDirtyData(data, columns) {
    _.map(data, function (item) {
      var obj = {};
      _.each(columns, function (column) {
        obj[column] = item[column];
      });
      return obj;
    });
  }

  //reset to initial data
  resetData() {
    if (this.param.data) {
      this.metadata.currentPage = 1;
      this.metadata.processingData = _.cloneDeep(this.param.data);
    }
  }

  //create room for a set of controls like export button, cross-table query input
  adjustContainer() {
    this.param.el.css({"position": "relative", "padding-top": "20px"});
  }

  render() {
    var $table = this.wdtb = $('<table id="LuyeTable"></table>');
    this.renderHead();
    this.renderBody();
    this.param.el.html($table);
    this.param.pagination && this.renderPages();
    this.param.managePageSize && this.renderLeftBoard();
    this.renderRightBoard();
  }

  renderHead() {
    this.wdtb.find('thead').remove();
    var $head = $('<thead></thead>');
    var $tr = $('<tr></tr>');
    _.each(this.metadata.processingColumns, function (headName) {
      var $th = $('<th></th>');
      var $checkbox = $('<input type="checkbox" class="hide" checked="checked">');
      var $sort = $('<div><div class="tangle-up arrows"></div><div class="tangle-down arrows"></div></div>');
      $th.text(headName.cname).data('db', headName.cdata);
      $th.append($checkbox).append($sort);
      if (headName.style == 'hide') {
        $th.addClass('hide');
        $th.find('input').val('off').removeAttr('checked');
      }
      $tr.append($th);
    });
    $head.append($tr);
    this.wdtb.append($head);
    this.attachSortingEvents();
    this.attachColumnCheckedEvents();
  }

  renderLeftBoard() {
    var that = this;
    var $board = $('<div class="left-board"></div>');
    $board.append('<label>每页数: </label>')
      .append('<select class="selectpicker showtick" ><option value="10">10</option><option value="20">20</option><option value="30">30</option><option value="50">50</option></select>');
    $board.find('select').val(this.param.pageCount);
    this.wdtb.before($board);
    this.attachPageSizeEvent();
  }

  renderRightBoard() {
    var $board = $('<div class="right-board"><button class="column-management">列管理</button><button class="column-management">重置</button></div>');
    this.param.export && $board.prepend('<input id="global-search" placeholder="全局关键字查询"/>');
    this.param.globalSearch && $board.append('<button id = "export-btn">导出</button>');
    this.wdtb.before($board);
    this.attachGlobalSearchEvent();
    this.attachColumnManagementEvents();
    this.attachExportEvent();
  }

  renderBody(keywords) {
    this.wdtb.find('tbody').remove();
    var $body = $('<tbody></tbody>');
    var columns = this.metadata.processingColumns;
    console.time('start');
    _.each(this.metadata.currentData, function (tr) {
      var $tr = $('<tr></tr>');
      _.each(columns, function (col) {
        var $td = $('<td></td>');
        if (!col.type) {
          var txt = _.get(tr, col.cdata) + "";
          keywords && _.each(keywords, function (keyword) {
            if (txt.indexOf(keyword) != -1) {
              var yellowstr = '<span class="yellowed">' + keyword + '</span>';
              txt = txt.replace(keyword, yellowstr);
            }
          });
          $td.html(txt).data('db', col.cdata);
        }
        else if (col.type == 'a') {
          var rawUrl = col.url.split('@@');
          var href = "";
          for (var i = 0; i < col.params.length; i++) {
            href += rawUrl[i];
            href += tr[col.params[i]];
          }
          href += _.last(rawUrl);
          console.log(href);
          var $a = $('<a></a>').text(col.cname).attr('href', href);
          $td.append($a);
        }
        if (col.style == 'fakeA') {
          $td.addClass('fake-a');
        }
        else if (col.style == 'hide') {
          $td.addClass('hide');
        }
        if (col.action) {
          // tr.columnName = col.cname;
          $td.on(col.action, tr, col.trigger).attr('columnName', col.cname);
          // (function (data) {
          //   console.log(data);
          //   $td.on(col.action, data, col.trigger);
          // })(tr);
        }
        $tr.append($td);
      });
      $body.append($tr);
    });
    console.timeEnd('end');
    this.wdtb.append($body);
  }

  renderPages() {
    var params = this.param;
    var metadata = this.metadata;
    $('ul.pagination').remove();
    var $pagination = $('<ul class="pagination"></ul>');
    var pageTotal = metadata.pageTotal = _.ceil(metadata.processingData.length / params.pageCount);
    var pageFirst = metadata.currentPage - 5 < 1 ? 1 : metadata.currentPage - 5;
    var pageLast = pageFirst + 10 > pageTotal ? pageTotal : pageFirst + 10;
    console.log(metadata.currentPage);
    for (var i = pageFirst; i <= pageLast; i++) {
      var $page = $('<span></span>');
      $page.text(i);
      if (i == metadata.currentPage) {
        $page.addClass('current-page');
      }
      $pagination.append($page);
    }
    if (metadata.currentPage > 1) {
      $pagination.prepend($('<span class="page-prev">&laquo;</span>'));
    }
    if (metadata.currentPage < pageTotal) {
      $pagination.append($('<span class="page-next">&raquo;</span>'));
    }
    this.wdtb.after($pagination);
    this.attachPagingEvents();
    this.renderPageInfo();
  }

  renderPageInfo() {
    var params = this.param;
    var metadata = this.metadata;
    if (_.isEmpty(this.wdtb.siblings('.page-info'))) {
      var $pageInfo = $('<div class="page-info"></div>');
      var $info1 = $('<span>当前第</span>').appendTo($pageInfo);
      var $pageCurrent = $('<input type="text" class="page-info-current">').val(metadata.currentPage).appendTo($pageInfo);
      var $info2 = $('<span>页 &nbsp 共</span>').appendTo($pageInfo);
      var $pageCount = $('<span class="page-info-pages"></span>').text(metadata.pageTotal).appendTo($pageInfo);
      var $info3 = $('<span>页 &nbsp 共</span>').appendTo($pageInfo);
      var $itemCount = $('<span class="page-info-items"></span>').text(metadata.processingData.length).appendTo($pageInfo);
      var $info4 = $('<span>条</span>').appendTo($pageInfo);
      var $error = $('<div class="page-info-error hide">请输入有效页码</div>').appendTo($pageInfo);
      this.wdtb.after($pageInfo);
      this.attachPagingInfoEvents();
    } else {
      params.el.find(".page-info-current").val(metadata.currentPage);
      params.el.find(".page-info-pages").text(metadata.pageTotal);
      params.el.find(".page-info-items").text(metadata.processingData.length);
      params.el.find('.page-info-error').addClass('hide');
    }
  }

  attachPageSizeEvent() {
    var that = this;
    $('.left-board select').change(function () {
      that.param.pageCount = parseInt($(this).val());
      that.refresh();
    });
  }

  attachSortingEvents() {
    var that = this;
    var metadata = that.metadata;
    _.each(this.wdtb.find('thead .arrows'), function (ele) {
      $(ele).click(function () {
        var $this = $(this);
        if ($this.hasClass('invisible')) {
          return;
        }
        var colTxt = $this.parents('th').text();
        var sortParam = _.find(that.param.columns, function (item) {
          return item.cname == colTxt;
        });
        if ($this.hasClass('tangle-up')) {
          metadata.processingData = _.sortBy(metadata.processingData, sortParam.cdata);
        } else {
          metadata.processingData = _.sortBy(metadata.processingData, sortParam.cdata).reverse();
        }
        metadata.currentPage = 1;
        that.refresh();
        $this.toggleClass('invisible');
      })
    });
  }

  attachPagingEvents() {
    var that = this;
    var metadata = that.metadata;
    _.each($('.pagination>span'), function (ele) {
      $(ele).click(function () {
        var $this = $(this);
        if ($this.hasClass('current-page')) {
          return;
        } else if ($this.hasClass('page-prev')) {
          metadata.currentPage = metadata.currentPage > 1 ? metadata.currentPage - 1 : 1;
        } else if ($this.hasClass('page-next')) {
          metadata.currentPage = metadata.currentPage < metadata.pageTotal ? metadata.currentPage + 1 : metadata.pageTotal;
        } else {
          metadata.currentPage = parseInt($this.text());
        }
        that.refresh();
      });
    });
  }

  attachPagingInfoEvents() {
    var that = this;
    $('.page-info-current').keydown(function () {
      if (event.keyCode == 13) {
        if ($('.page-info-current').val() >= 1 && $('.page-info-current').val() <= that.metadata.pageTotal) {
          that.metadata.currentPage = $('.page-info-current').val();
          that.refresh();
        } else {
          $('.page-info-current').val(that.metadata.currentPage);
          $('.page-info-error').removeClass('hide');
        }
      }
    });
  }

  attachGlobalSearchEvent() {
    var that = this;
    $('.right-board>input').keydown(function () {
      if (event.keyCode == 13) {
        var keyword = $(this).val();
        if (keyword === '') {
          that.resetData();
          that.refresh();
        }
        else {
          that.queryAll(keyword);
        }
      }
    });
  }

  attachColumnCheckedEvents() {
    this.wdtb.find('thead input').click(function () {
      if ($(this).val() == "on") {
        $(this).removeAttr('checked');
        $(this).val('off');
      }
      else {
        $(this).attr('checked', 'checked');
        $(this).val('on');
      }
    });
  }

  attachColumnManagementEvents() {
    var that = this;
    $('.right-board>button.column-management').click(function () {
      if (this.innerText == "列管理") {
        $('thead input').removeClass('hide');
        $(this).text('确定');
      }
      else if (this.innerText == "重置") {
        $(this).prev().text('列管理');
        that.resetColumns();
      }
      else if (this.innerText == "确定") {
        for (var i = 0; i < that.metadata.processingColumns.length; i++) {
          var val = $($('thead input')[i]).val();
          if (val == 'on') {
            that.metadata.processingColumns[i].style = "";
          }
          else {
            that.metadata.processingColumns[i].style = "hide";
          }
        }
        $(this).text('列管理');
        $(this).next().text('重置');
        that.renderHead();
        that.renderBody();
      }
    });
  }

  // dependencies: bolb FileSaver.js
  // inefficient, consider twice before using this function
  attachExportEvent() {
    var that = this;
    var columns = that.metadata.processingColumns;
    var data = that.metadata.processingData;
    $('#export-btn').click(function () {
      var exportedData = [];
      _.each(data, function (row) {
        var arr = [];
        for (var i = 0; i < columns.length; i++) {
          var str = _.get(row, columns[i].cdata) + "";
          if (str.indexOf(',') != -1) {
            str = str.split(',').join('，');
          }
          arr.push(str);
          if (i == columns.length - 1) {
            exportedData.push(arr + '\n')
          }
        }
      })
      exportedData.unshift(_.map(columns, 'cname') + '\n');
      var blob = new Blob(exportedData, {type: "text/plain;charset=utf-8"});
      saveAs(blob, "download.csv");
    });
  }

  resetSortingArrows() {
    this.wdtb.find('thead .arrows.invisible').toggleClass('invisible');
  }

  resetColumns() {
    this.metadata.processingColumns = _.cloneDeep(this.param.columns);
    this.renderHead();
    this.renderBody();
  }

  query(queryParams) {
    var that = this;
    this.resetData();
    var metadata = that.metadata;
    var yellowed = [];
    queryParams = _.sortBy(queryParams, 'predicate');
    _.each(queryParams, function (queryParam) {
      switch (queryParam.predicate) {
        case "eq":
          metadata.processingData = _.filter(metadata.processingData, function (item) {
            yellowed.push(queryParam.arg1);
            return item[queryParam.queryCol] == queryParam.arg1;
          });
          break;
        case "gt":
          metadata.processingData = _.filter(metadata.processingData, function (item) {
            return item[queryParam.queryCol] >= queryParam.arg1;
          });
          break;
        case "lt":
          metadata.processingData = _.filter(metadata.processingData, function (item) {
            return item[queryParam.queryCol] <= queryParam.arg1;
          });
          break;
        case "rg":
          metadata.processingData = _.filter(metadata.processingData, function (item) {
            return item[queryParam.queryCol] >= queryParam.arg1 && item[queryParam.queryCol] <= queryParam.arg2;
          });
          break;
        case "zkw":
          metadata.processingData = _.filter(metadata.processingData, function (item) {
            yellowed.push(queryParam.arg1);
            return item[queryParam.queryCol].indexOf(queryParam.arg1) != -1;
          });
          break;
      }
    });
    this.refresh(yellowed);
  }

  queryAll(keyword) {
    this.resetData();
    this.metadata.processingData = _.filter(this.metadata.processingData, function (item) {
      return _.values(item).join('`~``').indexOf(keyword) != -1;
    });
    this.refresh([keyword]);
  }

  refresh(keywords) {
    this.getCurrentData();
    this.resetSortingArrows();
    this.renderBody(keywords);
    this.param.pagination && this.renderPages();
  }

  destroy() {
    this.param.el.empty();
  }
}

