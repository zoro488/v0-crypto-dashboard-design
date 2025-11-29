#!/usr/bin/env python3
"""
🤖 AUTONOMOUS UI TESTING AGENT - CHRONOS SYSTEM
Tests UI components, forms positioning, data display, and auto-fixes issues
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

try:
    from playwright.async_api import async_playwright, Page, Browser
    import pandas as pd
except ImportError:
    print("📦 Installing required packages...")
    os.system("pip install playwright pandas")
    os.system("playwright install chromium")
    from playwright.async_api import async_playwright, Page, Browser
    import pandas as pd

class AutonomousUITester:
    """Autonomous agent that tests and fixes UI issues"""
    
    def __init__(self):
        self.base_url = os.getenv('BASE_URL', 'http://localhost:3000')
        self.reports_dir = Path(__file__).parent / 'reports' / 'ui'
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        self.fixes_dir = Path(__file__).parent / 'fixes'
        self.fixes_dir.mkdir(exist_ok=True)
        
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'tests': [],
            'issues_found': [],
            'fixes_applied': [],
            'summary': {}
        }
    
    async def test_splash_screen(self, page: Page) -> Dict[str, Any]:
        """Test splash screen with CHRONOS particles"""
        result = {
            'test': 'splash_screen',
            'status': 'pending',
            'issues': [],
            'metrics': {}
        }
        
        try:
            print("🎬 Testing Splash Screen...")
            
            # Wait for splash screen
            await page.wait_for_selector('[data-testid="chronos-particles"]', timeout=10000)
            
            # Check if CHRONOS text is visible
            chronos_text = await page.locator('text=CHRONOS').is_visible()
            if not chronos_text:
                result['issues'].append("CHRONOS text not visible")
            
            # Check particles animation
            particles = await page.locator('[data-testid="chronos-particles"]').count()
            result['metrics']['particle_count'] = particles
            
            if particles < 50:
                result['issues'].append(f"Too few particles: {particles} (expected 50+)")
            
            # Wait for splash to finish (5.5 seconds)
            await asyncio.sleep(6)
            
            # Check if dashboard is now visible
            dashboard_visible = await page.locator('[data-testid="dashboard"]').is_visible()
            if not dashboard_visible:
                result['issues'].append("Dashboard not visible after splash")
            
            result['status'] = 'passed' if len(result['issues']) == 0 else 'failed'
            
        except Exception as e:
            result['status'] = 'error'
            result['issues'].append(f"Error: {str(e)}")
        
        return result
    
    async def test_dashboard_3d(self, page: Page) -> Dict[str, Any]:
        """Test 3D dashboard background"""
        result = {
            'test': 'dashboard_3d',
            'status': 'pending',
            'issues': [],
            'metrics': {}
        }
        
        try:
            print("🎨 Testing 3D Dashboard...")
            
            # Check for Spline component
            spline_present = await page.locator('canvas').count() > 0
            result['metrics']['has_3d_canvas'] = spline_present
            
            if not spline_present:
                result['issues'].append("3D canvas not found")
            
            # Check canvas size
            if spline_present:
                canvas = page.locator('canvas').first
                box = await canvas.bounding_box()
                if box:
                    result['metrics']['canvas_width'] = box['width']
                    result['metrics']['canvas_height'] = box['height']
                    
                    if box['width'] < 800:
                        result['issues'].append(f"Canvas too narrow: {box['width']}px")
            
            result['status'] = 'passed' if len(result['issues']) == 0 else 'failed'
            
        except Exception as e:
            result['status'] = 'error'
            result['issues'].append(f"Error: {str(e)}")
        
        return result
    
    async def test_bento_panels(self, page: Page) -> Dict[str, Any]:
        """Test all 15 Bento panels"""
        result = {
            'test': 'bento_panels',
            'status': 'pending',
            'issues': [],
            'metrics': {}
        }
        
        try:
            print("📊 Testing Bento Panels...")
            
            expected_panels = [
                'BentoDashboard',
                'BentoVentas',
                'BentoClientes',
                'BentoDistribuidores',
                'BentoOrdenesCompra',
                'BentoAlmacen',
                'BentoBovedaMonte',
                'BentoBovedaUSA',
                'BentoUtilidades',
                'BentoFletes',
                'BentoAzteca',
                'BentoLeftie',
                'BentoProfit',
                'BentoReportes',
                'BentoIA'
            ]
            
            panels_found = []
            
            for panel_name in expected_panels:
                panel_selector = f'[data-panel="{panel_name}"]'
                panel_exists = await page.locator(panel_selector).count() > 0
                
                if panel_exists:
                    panels_found.append(panel_name)
                    
                    # Check visibility
                    is_visible = await page.locator(panel_selector).is_visible()
                    if not is_visible:
                        result['issues'].append(f"Panel {panel_name} exists but not visible")
                    
                    # Check positioning
                    box = await page.locator(panel_selector).bounding_box()
                    if box:
                        if box['y'] < 0:
                            result['issues'].append(f"Panel {panel_name} positioned above viewport (y={box['y']})")
                        if box['y'] > 5000:
                            result['issues'].append(f"Panel {panel_name} positioned too far down (y={box['y']})")
                else:
                    result['issues'].append(f"Panel {panel_name} not found")
            
            result['metrics']['panels_found'] = len(panels_found)
            result['metrics']['panels_expected'] = len(expected_panels)
            result['metrics']['panels_list'] = panels_found
            
            result['status'] = 'passed' if len(result['issues']) == 0 else 'failed'
            
        except Exception as e:
            result['status'] = 'error'
            result['issues'].append(f"Error: {str(e)}")
        
        return result
    
    async def test_forms_positioning(self, page: Page) -> Dict[str, Any]:
        """Test all forms are properly positioned and visible"""
        result = {
            'test': 'forms_positioning',
            'status': 'pending',
            'issues': [],
            'metrics': {},
            'fixes': []
        }
        
        try:
            print("📝 Testing Forms Positioning...")
            
            # Test Nueva Venta modal
            await page.click('button:has-text("Nueva Venta")')
            await asyncio.sleep(1)
            
            modal = page.locator('[role="dialog"]').first
            modal_visible = await modal.is_visible()
            
            if modal_visible:
                box = await modal.bounding_box()
                if box:
                    result['metrics']['modal_top'] = box['y']
                    result['metrics']['modal_height'] = box['height']
                    
                    viewport = await page.viewport_size()
                    viewport_height = viewport['height']
                    
                    # Check if modal is centered
                    modal_center = box['y'] + (box['height'] / 2)
                    viewport_center = viewport_height / 2
                    
                    if abs(modal_center - viewport_center) > 100:
                        issue = f"Modal not centered: modal_center={modal_center}, viewport_center={viewport_center}"
                        result['issues'].append(issue)
                        
                        # Generate fix
                        fix = {
                            'component': 'CreateVentaModal',
                            'issue': 'Modal not vertically centered',
                            'fix': 'Add className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"'
                        }
                        result['fixes'].append(fix)
                    
                    # Check if content is visible (not cut off)
                    if box['y'] + box['height'] > viewport_height:
                        issue = f"Modal content extends beyond viewport: bottom={box['y'] + box['height']}, viewport={viewport_height}"
                        result['issues'].append(issue)
                        
                        fix = {
                            'component': 'CreateVentaModal',
                            'issue': 'Modal content cut off at bottom',
                            'fix': 'Add max-h-[90vh] overflow-y-auto to modal content'
                        }
                        result['fixes'].append(fix)
                
                # Check all form fields are visible
                fields = [
                    'input[name="cliente"]',
                    'input[name="cantidad"]',
                    'input[name="precioVenta"]',
                    'select[name="estadoPago"]',
                    'button[type="submit"]'
                ]
                
                for field in fields:
                    field_visible = await page.locator(field).is_visible()
                    if not field_visible:
                        result['issues'].append(f"Form field not visible: {field}")
                
                # Close modal
                await page.keyboard.press('Escape')
                await asyncio.sleep(0.5)
            else:
                result['issues'].append("Nueva Venta modal not visible")
            
            result['status'] = 'passed' if len(result['issues']) == 0 else 'failed'
            
        except Exception as e:
            result['status'] = 'error'
            result['issues'].append(f"Error: {str(e)}")
        
        return result
    
    async def test_data_display(self, page: Page) -> Dict[str, Any]:
        """Test that CSV data is properly displayed in tables"""
        result = {
            'test': 'data_display',
            'status': 'pending',
            'issues': [],
            'metrics': {}
        }
        
        try:
            print("📊 Testing Data Display...")
            
            # Check ventas data (96 records expected)
            await page.click('text=Ventas')
            await asyncio.sleep(2)
            
            # Count table rows
            rows = await page.locator('table tbody tr').count()
            result['metrics']['ventas_rows_displayed'] = rows
            
            if rows == 0:
                result['issues'].append("No ventas data displayed in table")
            elif rows < 96:
                result['issues'].append(f"Incomplete ventas data: {rows}/96 records")
            
            # Check clientes data
            await page.click('text=Clientes')
            await asyncio.sleep(2)
            
            cliente_rows = await page.locator('table tbody tr').count()
            result['metrics']['clientes_rows_displayed'] = cliente_rows
            
            if cliente_rows == 0:
                result['issues'].append("No clientes data displayed")
            elif cliente_rows < 31:
                result['issues'].append(f"Incomplete clientes data: {cliente_rows}/31 records")
            
            result['status'] = 'passed' if len(result['issues']) == 0 else 'failed'
            
        except Exception as e:
            result['status'] = 'error'
            result['issues'].append(f"Error: {str(e)}")
        
        return result
    
    async def test_visualizations(self, page: Page) -> Dict[str, Any]:
        """Test 8 Canvas visualizations at 60fps"""
        result = {
            'test': 'visualizations',
            'status': 'pending',
            'issues': [],
            'metrics': {}
        }
        
        try:
            print("🎨 Testing Canvas Visualizations...")
            
            # Count canvas elements (should be 8)
            canvases = await page.locator('canvas[data-visualization]').count()
            result['metrics']['canvas_count'] = canvases
            
            if canvases < 8:
                result['issues'].append(f"Missing visualizations: {canvases}/8 found")
            
            # Check animation performance
            # Measure FPS by counting requestAnimationFrame calls
            fps_script = """
                new Promise((resolve) => {
                    let frames = 0;
                    const startTime = performance.now();
                    
                    function countFrame() {
                        frames++;
                        if (performance.now() - startTime < 1000) {
                            requestAnimationFrame(countFrame);
                        } else {
                            resolve(frames);
                        }
                    }
                    
                    requestAnimationFrame(countFrame);
                });
            """
            
            fps = await page.evaluate(fps_script)
            result['metrics']['fps'] = fps
            
            if fps < 50:
                result['issues'].append(f"Low FPS detected: {fps}fps (expected 60fps)")
            
            result['status'] = 'passed' if len(result['issues']) == 0 else 'failed'
            
        except Exception as e:
            result['status'] = 'error'
            result['issues'].append(f"Error: {str(e)}")
        
        return result
    
    async def apply_fixes(self):
        """Generate and apply fixes for detected issues"""
        print("\n🔧 Generating fixes...")
        
        fixes_to_apply = []
        
        for test in self.test_results['tests']:
            if 'fixes' in test:
                fixes_to_apply.extend(test['fixes'])
        
        if not fixes_to_apply:
            print("✅ No fixes needed!")
            return
        
        # Generate fixes file
        fixes_file = self.fixes_dir / f"ui_fixes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(fixes_file, 'w') as f:
            json.dump(fixes_to_apply, f, indent=2)
        
        print(f"📝 Fixes generated: {fixes_file}")
        print(f"🔧 Total fixes: {len(fixes_to_apply)}")
        
        for fix in fixes_to_apply:
            print(f"  - {fix['component']}: {fix['issue']}")
            print(f"    Fix: {fix['fix']}")
    
    async def run_all_tests(self):
        """Run all UI tests"""
        print("\n" + "="*80)
        print("🤖 STARTING AUTONOMOUS UI TESTING")
        print("="*80 + "\n")
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1920, 'height': 1080}
            )
            page = await context.new_page()
            
            try:
                # Navigate to app
                print(f"🌐 Navigating to {self.base_url}...")
                await page.goto(self.base_url, wait_until='networkidle')
                
                # Run all tests
                tests = [
                    self.test_splash_screen(page),
                    self.test_dashboard_3d(page),
                    self.test_bento_panels(page),
                    self.test_forms_positioning(page),
                    self.test_data_display(page),
                    self.test_visualizations(page)
                ]
                
                for test_coro in tests:
                    result = await test_coro
                    self.test_results['tests'].append(result)
                    
                    status_emoji = {
                        'passed': '✅',
                        'failed': '❌',
                        'error': '⚠️'
                    }.get(result['status'], '❓')
                    
                    print(f"{status_emoji} {result['test']}: {result['status']}")
                    
                    if result['issues']:
                        for issue in result['issues']:
                            print(f"   - {issue}")
                
            finally:
                await browser.close()
        
        # Generate summary
        total_tests = len(self.test_results['tests'])
        passed_tests = sum(1 for t in self.test_results['tests'] if t['status'] == 'passed')
        failed_tests = sum(1 for t in self.test_results['tests'] if t['status'] == 'failed')
        error_tests = sum(1 for t in self.test_results['tests'] if t['status'] == 'error')
        
        self.test_results['summary'] = {
            'total_tests': total_tests,
            'passed': passed_tests,
            'failed': failed_tests,
            'errors': error_tests,
            'success_rate': (passed_tests / total_tests * 100) if total_tests > 0 else 0
        }
        
        # Apply fixes
        await self.apply_fixes()
        
        # Save report
        report_file = self.reports_dir / f"ui_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"✅ Passed: {passed_tests}/{total_tests}")
        print(f"❌ Failed: {failed_tests}/{total_tests}")
        print(f"⚠️  Errors: {error_tests}/{total_tests}")
        print(f"📊 Success Rate: {self.test_results['summary']['success_rate']:.1f}%")
        print(f"\n📝 Report saved: {report_file}")
        print("="*80 + "\n")
        
        return self.test_results

if __name__ == "__main__":
    tester = AutonomousUITester()
    results = asyncio.run(tester.run_all_tests())
    
    # Exit with error if tests failed
    if results['summary']['failed'] > 0 or results['summary']['errors'] > 0:
        sys.exit(1)
    else:
        print("✅ ALL UI TESTS PASSED!")
        sys.exit(0)
