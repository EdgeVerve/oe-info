/**
 * @license
 * ©2018-2019 EdgeVerve Systems Limited (a fully owned Infosys subsidiary),
 * Bangalore, India. All Rights Reserved.
 */
import {
  html,
  PolymerElement
} from "@polymer/polymer/polymer-element.js";
import "oe-i18n-msg/oe-i18n-msg.js";
import "@polymer/iron-flex-layout/iron-flex-layout.js";
import "@polymer/polymer/lib/elements/dom-if.js";
import {
  OEDataMaskMixin
} from "oe-mixins/data-mask-mixin.js";
import {
  OEFieldMixin
} from "oe-mixins/oe-field-mixin.js";
import "oe-utils/oe-utils.js";
import "oe-utils/date-utils.js";

/**
 * `oe-info`
 * A element used to display formatted values of numeric, string and date type
 *
 * ### Styling
 *  
 * `<oe-info>` provides the following custom properties and mixins for styling:
 *  
 * Custom property | Description | Default
 * ----------------|-------------|----------
 * `--oe-info-label` | Mixin applied to label section | {}
 * `--oe-info-value` | Mixin applied to value section | {}
 * 
 * @customElement
 * @polymer
 * @appliesMixin OEFieldMixin
 * @appliesMixin OEDataMaskMixin
 * @demo /demo/index.html
 */
class OeInfo extends OEFieldMixin(PolymerElement) {
  static get is() {
    return 'oe-info';
  }

  static get template() {
    return html `
      <style >
        #label,
        #info {
          padding: 2px 0;
        }
    
        .vertical {
          @apply --layout-vertical;
          @apply --oe-info-container;
        }
    
        .horizontal {
          @apply --layout-horizontal;
        }
    
        .horizontal > #label {
          padding-right: 10px;
        }
    
        #label {
          font-size: 12px;
          color: var(--secondary-text-color);
    
          @apply --oe-info-label;
        }
    
        #info {
          font-size: 15px;
    
          @apply --oe-info-value;
        }
        .hide {
          display: none;
        }
      </style>
      <div class$="[[layout]]" aria-label$="[[_computeAreaLabel(translatedLabel, display, translatedDisplay, type)]]">
        <div id="label" aria-hidden="true">
          <oe-i18n-msg msgid=[[label]] msg={{translatedLabel}}>[[label]]</oe-i18n-msg>
        </div>
        <div id="info" aria-hidden="true">
          <dom-if if=[[!_needI18n(type)]]>
            <template>[[display]]</template>
          </dom-if>
          <dom-if if=[[_needI18n(type)]]>
            <template>
              <oe-i18n-msg msgid=[[display]] msg={{translatedDisplay}}>[[display]]</oe-i18n-msg>
            </template>
          </dom-if>
            <!-- dummy span to ensure div with empty value occupies the space -->
            <span class="required" class$=[[_getClass(display)]]>&nbsp;</span>
        </div>
    </div>
    `;
  }

  static get properties() {
    return {
      /**
       * Label for the element
       */
      label: {
        type: String
      },

      /**
       * Value to format and display
       */
      value: {
        type: Object,
        observer: '_refresh'
      },

      /**
       * formatted display value
       */
      display: {
        type: String,
        notify: true
      },

      /**
       * `type` controls how the `value` is formatted
       * * `double|number|decimal` : `value` is converted to locale string based on given `precision`
       * * `date`: if `format` is specified, value is formatted using momentjs. If `format is not provided, toLocaleDateString function is used for formatting.
       * * `boolean`: `true` is formatted as 'Yes' and `false` is formatted as 'No'. You can use Literal i18n translations to customize the value.
       * * `*` : For everything else, no formatting is applied.
       */
      type: {
        type: String,
        value: 'text',
        observer: '_refresh'
      },

      /**
       * Decimal display precision for `type` : [number, double , decimal]
       */
      precision: {
        type: Number,
        value: 2,
        observer: '_refresh'
      },

      /**
       * Format string used to format
       */
      format: {
        type: String,
        observer: '_refresh'
      },

      /**
       * Controls the relative positions of `label` and `value`.
       * * vertical : label is displayed above the value (much like oe-input)
       * * horizontal : label is displayed on left and value on right
       */
      layout: {
        type: String,
        value: 'vertical'
      },
      /**
       * If user prefers a different timezone for date to be displayed.
       */
      preferredTimezone: {
        type: Number,
        value: function () {
          var OEUtils = window.OEUtils;
          OEUtils.componentDefaults = OEUtils.componentDefaults || {};
          OEUtils.componentDefaults["oe-info"] = OEUtils.componentDefaults["oe-info"] || {};
          //Setting offset based on given offset value / current time zone offset value in minutes
          return OEUtils.componentDefaults["oe-info"].preferredTimezone || -((new Date()).getTimezoneOffset());
        }
      }
    };
  }

  _computeAreaLabel(translatedLabel, display, translatedDisplay, type){
    if(this._needI18n(type)){
      return translatedLabel + " " + translatedDisplay;
    } else {
      return translatedLabel + " " + display;
    }
  }

  /**
   * For boolean values, we need i18n so that Yes/No etc. can be translated appropriately.
   * @param {string} type type of the value 
   * @return {boolean} flag denoting the value is of type Boolean
   */
  _needI18n(type) {
    return type == 'boolean';
  }

  _getClass(display) {
    return !display ? '' : 'hide';
  }

  /**
   * Refresh the display due to either value or some configuration attribute change.
   */
  _refresh() {

    var nval = this.value;
    var newDisplay = '';
    var OEUtils = window.OEUtils || {};
    var type = this.type || 'text';
    var moment = window.moment;
    switch (type) {
      case 'date': {
        newDisplay = '';
        if (nval) {
          if (this.format && this.format != 'date' && typeof moment !== 'undefined') {
            newDisplay = moment.utc(nval).format(this.format);
          } else {
            newDisplay = OEUtils.DateUtils.utcDateFormatter.format(new Date(nval));
          }
        }
        break;
      }
      case 'timestamp': {
        newDisplay = '';
        if (nval) {
          /** Apply preferred timezone offset on the current date value before
           * formatting it for display
           */
          var dateLocal = new Date(nval);
          dateLocal.setMinutes(dateLocal.getMinutes() + this.preferredTimezone + dateLocal.getTimezoneOffset());
          var dateFormat = this.format || ((OEUtils.TypeMappings && OEUtils.TypeMappings.date) ?
            OEUtils.TypeMappings.date.format :
            undefined);
          if (dateFormat && dateFormat !== 'date' && typeof moment !== 'undefined') {
            newDisplay = moment(dateLocal).format(dateFormat);
          } else {
            newDisplay = dateLocal.toLocaleString();
          }
        }
        break;
      }
      case 'integer': {

        newDisplay = (nval !== undefined || nval !== null) ? Number(nval).toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
          useGrouping: false
        }) : '';
        break;
      }
      case 'number':
      case 'double':
      case 'decimal': {

        newDisplay = (nval !== undefined || nval !== null) ? Number(nval).toLocaleString(undefined, {
          minimumFractionDigits: this.precision,
          maximumFractionDigits: this.precision
        }) : '';
        if (this.format) {
          newDisplay = this.format.replace('@v', newDisplay);
        }
        break;
      }
      case 'boolean': {
        newDisplay = nval ? 'Yes' : 'No';
        break;
      }
      default:
        var valueType = typeof nval;
        if (valueType === 'undefined' || nval === null) {
          newDisplay = '';
        } else if (valueType === 'string') {
          newDisplay = nval;
          if (this.format && this.format.indexOf('@v') >= 0) {
            newDisplay = this.format.replace('@v', newDisplay);
          }
        } else {
          /* Possibly an object */
          if (this.format) {
            var placeholders = this.format.match(/\$\[[\w.]*\]/g);
            if (placeholders && placeholders.length > 0) {
              newDisplay = this.format;
              placeholders.forEach(ph => {
                /* ph = '${name}' -----> key = 'name' */
                var key = ph.substring(2, ph.length - 1);
                newDisplay = newDisplay.replace(ph, this._deepValue(nval, key));
              });
            } else {
              newDisplay = nval.toString();
            }
          } else {
            newDisplay = nval.toString();
          }
        }

        break;
    }

    this._maskDisplay(newDisplay);
  }

}
if (!window.moment) {
  console.warn('OE-INFO : Import moment.js at the document level to support date formats.');
}
window.customElements.define(OeInfo.is, OEDataMaskMixin(OeInfo));