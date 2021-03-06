'use strict';
import React from 'react';
import { Link } from 'react-router';
import Ace from 'react-ace';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { get } from 'object-path';
import { getCollection } from '../../actions';
import { lastUpdated, nullValue, getCollectionId } from '../../utils/format';
import config from '../../config';
import Loading from '../app/loading-indicator';

class CollectionIngest extends React.Component {
  constructor () {
    super();
    this.displayName = 'CollectionIngest';
    this.state = {
      view: 'json'
    };
    this.get = this.get.bind(this);
    this.renderReadOnlyJson = this.renderReadOnlyJson.bind(this);
    this.renderList = this.renderList.bind(this);
    this.renderJson = this.renderJson.bind(this);
  }

  componentDidUpdate (prevProps) {
    const { name, version } = prevProps.params;
    const collectionId = getCollectionId({ name, version });
    const record = prevProps.collections.map[collectionId];
    if (!record) {
      this.get(name, version);
    }
  }

  componentDidMount () {
    const { name, version } = this.props.params;
    this.get(name, version);
  }

  get (name, version) {
    this.props.dispatch(getCollection(name, version));
  }

  renderReadOnlyJson (name, data) {
    return (
      <Ace
        mode='json'
        theme={config.editorTheme}
        name={`collection-read-only-${name}`}
        readOnly={true}
        value={JSON.stringify(data, null, '\t')}

        width='auto'
        tabSize={config.tabSize}
        showPrintMargin={false}
        minLines={1}
        maxLines={35}
        wrapEnabled={true}
      />
    );
  }

  render () {
    const { name, version } = this.props.params;
    const collectionId = getCollectionId(this.props.params);
    const record = this.props.collections.map[collectionId];
    if (!record || (record.inflight && !record.data)) {
      return <Loading />;
    }
    const { data } = record;
    return (
      <div className='page__component'>
        <section className='page__section page__section__header-wrapper'>
          <h1 className='heading--large heading--shared-content with-description'>{name}</h1>
          <Link className='button button--small form-group__element--right button--green' to={`/collections/edit/${name}/${version}`}>Edit</Link>
          {lastUpdated(data.queriedAt)}
        </section>
        <section className='page__section'>
          <div className='tab--wrapper'>
            <button className={'button--tab ' + (this.state.view === 'json' ? 'button--active' : '')}
              onClick={() => this.state.view !== 'json' && this.setState({ view: 'json' })}>JSON View</button>
          </div>
          <div>
            {this.state.view === 'list' ? this.renderList(data) : this.renderJson(data)}
          </div>
        </section>
      </div>
    );
  }

  renderList (data) {
    const ingest = get(data, 'ingest', {});
    const recipe = get(data, 'recipe', {});

    return (
      <div className='list-view'>
        <section className='page__section--small'>
          <h2 className='heading--medium'>Ingest</h2>
          <p>Type: {ingest.type}</p>
          <dt>Configuration</dt>
          <dd>Concurrency: {get(ingest, 'config.concurrency', nullValue)}</dd>
          <dd>Endpoint: {get(ingest, 'config.endpoint', nullValue)}</dd>
        </section>

        <section className='page__section--small'>
          <h2 className='heading--medium'>Recipe</h2>

          <dt>Order</dt>
          {get(recipe, 'order', []).map((step, i) => <dd key={i}>{step}</dd>)}

          <dt>Process step</dt>
          <dd>Description: {get(recipe, 'processStep.description', '--')}</dd>

          <dt>Input files</dt>
          {get(recipe, 'processStep.config.inputFiles', []).map((file, i) => <dd key={i}>{file}</dd>)}

          <dt>Output files</dt>
          {get(recipe, 'processStep.config.outputFiles', []).map((file, i) => <dd key={i}>{file}</dd>)}
        </section>
      </div>
    );
  }

  renderJson (data) {
    return (
      <ul>
        <li>
          <label>{data.name}</label>
          {this.renderReadOnlyJson('recipe', data)}
        </li>
      </ul>
    );
  }
}

CollectionIngest.propTypes = {
  params: PropTypes.object,
  collections: PropTypes.object,
  dispatch: PropTypes.func
};

export default connect(state => state)(CollectionIngest);
