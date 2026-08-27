const fs = require('fs');
const files = [
  'src/app/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/directory/page.tsx',
  'src/app/hub/page.tsx',
  'src/app/events/page.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Remove imports
    content = content.replace(/import \{ Card.*?\} from '@\/components\/ui\/card';\n/g, '');
    content = content.replace(/import \{ Button.*?\} from '@\/components\/ui\/button';\n/g, '');
    content = content.replace(/import \{ Input.*?\} from '@\/components\/ui\/input';\n/g, '');
    content = content.replace(/import \{ Textarea.*?\} from '@\/components\/ui\/textarea';\n/g, '');
    content = content.replace(/import \{ Label.*?\} from '@\/components\/ui\/label';\n/g, '');

    // Replace Components with divs
    content = content.replace(/<Card className="([^"]+)">/g, '<div className="rounded-xl border ">');
    content = content.replace(/<Card>/g, '<div className="rounded-xl border bg-white shadow-sm">');
    content = content.replace(/<\/Card>/g, '</div>');

    content = content.replace(/<CardHeader className="([^"]+)">/g, '<div className="p-6 pb-2 ">');
    content = content.replace(/<CardHeader>/g, '<div className="p-6 pb-2">');
    content = content.replace(/<\/CardHeader>/g, '</div>');

    content = content.replace(/<CardTitle className="([^"]+)">/g, '<h3 className="font-semibold tracking-tight ">');
    content = content.replace(/<CardTitle>/g, '<h3 className="text-lg font-semibold tracking-tight">');
    content = content.replace(/<\/CardTitle>/g, '</h3>');

    content = content.replace(/<CardContent className="([^"]+)">/g, '<div className="p-6 pt-0 ">');
    content = content.replace(/<CardContent>/g, '<div className="p-6 pt-0">');
    content = content.replace(/<\/CardContent>/g, '</div>');

    // Replace Button
    content = content.replace(/<Button\b([^>]*)>/g, (match, p1) => {
      // Remove variant prop if exists
      let newProps = p1.replace(/variant="[^"]+"/, '');
      // Add standard button styles if className doesn't exist, else append
      if (newProps.includes('className="')) {
         newProps = newProps.replace(/className="/, 'className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ');
      } else {
         newProps += ' className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2"';
      }
      return '<button' + newProps + '>';
    });
    content = content.replace(/<\/Button>/g, '</button>');

    // Replace Label, Input, Textarea
    content = content.replace(/<Label>/g, '<label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">');
    content = content.replace(/<\/Label>/g, '</label>');
    
    content = content.replace(/<Input /g, '<input className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50" ');
    content = content.replace(/<Textarea /g, '<textarea className="flex w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50" ');

    fs.writeFileSync(file, content);
    console.log('Fixed ' + file);
  }
});
