import '@ionic/core';
import '@stencil/core';
import { Config } from '@ionic/core';

import { Component, Element, Listen, Prop, State} from '@stencil/core';

import { GraphTypeCtrl } from '../../providers/graphType';

import _ from 'lodash';

@Component({
	tag: 'page-add-type-modal',
	styleUrl: 'page-add-type-modal.css',
})
export class PageSignup {
	@Element() el: any;

	@Prop({ context: 'config' }) config: Config;
  @State() submitted = false;

	@State() name = {
		valid: false,
		value: null
	};
	@State() description = '';

	@State() type = 'type';

	handleName(ev) {
		this.validateName();
		this.name = {
			...this.name,
			value: ev.target.value
		};
	}

	handleDescription(ev) {
		this.description = ev.target.value;
	}

	@Listen('ionChange')
	handleType(ev: any) {
		this.type = ev.target.value;
	}


	validateName() {
		if (!_.isEmpty(this.name.value)) {
			this.name = {
				...this.name,
				valid: true
			};
			return;
		}

		this.name = {
			...this.name,
			valid: false
		};
	}

	dismiss(data?: any) {
		// dismiss this modal and pass back data
		(this.el.closest('ion-modal') as any).dismiss(data);
	}

	onSubmit(e) {

		e.preventDefault();
		this.submitted = true;
		this.validateName();

		if (this.name.valid) {
			GraphTypeCtrl.addType(this.name.value, this.type, this.description);
			this.dismiss();
		}
	}

	render() {
		const mode = this.config.get('mode');

		return [
			<ion-header>
				<ion-toolbar>
					<ion-buttons slot={mode === 'md' ? 'end' : 'start'}>
						<ion-button onClick={() => this.dismiss()}>Cancel</ion-button>
					</ion-buttons>

					<ion-title>
						New Type
			</ion-title>
			</ion-toolbar>
			</ion-header>,

			<ion-content padding>
				<form novalidate>
					<ion-list>
					<ion-item>
  					<ion-label>GraphQL Type</ion-label>
  						<ion-select value={this.type} interface="alert">
								<ion-select-option value="type">Type</ion-select-option>
								<ion-select-option value="interface">Interface</ion-select-option>
								<ion-select-option value="enum">Enum</ion-select-option>
								<ion-select-option value="scalar">Scalar</ion-select-option>
								<ion-select-option value="union">Union</ion-select-option>
  						</ion-select>
						</ion-item>
						<ion-item>
							<ion-label stacked color="primary">Name*</ion-label>
							<ion-input name="name" type="text" value={this.name.value} onInput={(ev) => this.handleName(ev)} required>
							</ion-input>
						</ion-item>
						<ion-text color="danger">
							<p hidden={this.name.valid || this.submitted === false} padding-left>
								Name is required
				</p>
						</ion-text>
						<ion-item>
							<ion-label stacked color="primary">Description</ion-label>
							<ion-textarea  name="description" value={this.description} onInput={(ev) => this.handleDescription(ev)} rows={6}></ion-textarea>
						</ion-item>
					</ion-list>

					<div padding>
						<ion-button onClick={(e) => this.onSubmit(e)} type="submit" expand="block">Create</ion-button>
					</div>
				</form>

			</ion-content>


		];
	}
}
