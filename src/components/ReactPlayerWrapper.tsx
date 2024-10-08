'use client';

import React, { forwardRef } from 'react';
import ReactPlayer from 'react-player';

const ReactPlayerWrapper = forwardRef<any, any>((props, ref) => (
  <ReactPlayer {...props} ref={ref} />
));

export default ReactPlayerWrapper;
