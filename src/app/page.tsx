// src/app/page.tsx
'use client';

import VideoAnnotator from '../components/VideoAnnotator';

const Home: React.FC = () => {
  return (
    // <div className="container mx-auto p-4">
    //   <h1 className="text-3xl font-bold mb-4">视频标注工具</h1>
      <VideoAnnotator />
    // </div>
  );
};

export default Home;
// src/pages/index.tsx
// 'use client';

// import SimpleKonva from '../components/SimpleKonva';

// const Home: React.FC = () => {
//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold mb-4">测试 Konva</h1>
//       <SimpleKonva />
//     </div>
//   );
// };

// export default Home;
