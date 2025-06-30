import React from 'react';
import DefaultAdmonitionTypes from '@theme-original/Admonition/Types';

function AIWarning(props) {
  return (
    <div className="theme-admonition theme-admonition-info admonition_xJq3 alert alert--info">
      <h5>🤖 {props.title}</h5>
      <div>{props.children}</div>
    </div>
  );
}

const AdmonitionTypes = {
  ...DefaultAdmonitionTypes,

  // Add all your custom admonition types here...
  // You can also override the default ones if you want
  'AI': AIWarning,
};

export default AdmonitionTypes;